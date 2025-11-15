/**
 * scripts/generate_zen_outputs.js
 *
 * Batch-generate Zen-Tap pre-generated outputs (模式 B: 64 x 64 x 3)
 *
 * Usage:
 *   # install deps (only once)
 *   # in repo root:
 *   # npm install node-fetch p-queue dotenv
 *
 *   # test mode (quick small sample, safe)
 *   node scripts/generate_zen_outputs.js --mode=test --count=40 --concurrency=6
 *
 *   # full mode (generate all combos based on public_semantics.json)
 *   node scripts/generate_zen_outputs.js --mode=full --concurrency=6
 *
 * Environment (.env):
 *   API_KEY=your_api_key_here
 *   API_URL=https://api.deepseek.com/chat/completions   # or your provider URL
 *
 * Output:
 *   writes to data/zen_outputs.json (checkpointed during generation)
 *
 * Important:
 *   - Keep .env and private files out of git (add to .gitignore)
 *   - Run locally on a reliable network
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import PQueue from "p-queue";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
if (!API_KEY || !API_URL) {
  console.error("Missing API_KEY or API_URL in environment. Create a .env file with API_KEY and API_URL.");
  process.exit(1);
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_SEM_PATH = path.join(DATA_DIR, "public_semantics.json");
const OUTPUTS_PATH = path.join(DATA_DIR, "zen_outputs.json");
const CHECKPOINT_EVERY = 50; // save every N records

// change levels for 模式 B
const CHANGE_LEVELS = ["C0", "C1", "C2"]; // stable / slight / strong

// parse args
const argv = process.argv.slice(2);
const args = {};
argv.forEach(item => {
  const [k, v] = item.replace(/^--/, "").split("=");
  args[k] = v === undefined ? true : v;
});
const mode = args.mode || "test"; // test or full
const concurrency = parseInt(args.concurrency || 6, 10);
const testCount = parseInt(args.count || 100, 10);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeWriteJson(filepath, obj) {
  fs.writeFileSync(filepath, JSON.stringify(obj, null, 2), "utf-8");
}

function buildPrompt(mainSummary, trendSummary, changeSummary) {
  // Compact, high-quality prompt (we already optimized earlier)
  return `
你是一位以清晰洞察与温柔表达见长的现代心灵顾问。
请根据以下信息，为用户生成一段心灵提示（结构：当前→趋势→注意→结尾）。
核心态势：${mainSummary}
趋势：${trendSummary}
变化提示：${changeSummary}
要求：语言现代、平静，不使用“维度/频率/Codesign”等术语；正文约140-180字；结尾一句不超过10字的温柔提醒。
  `.trim();
}

async function callLLM(prompt) {
  // Generic POST; adjust per provider response format
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    }),
    // node-fetch doesn't support timeout option directly here in v3; keep it simple
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${t}`);
  }
  const data = await res.json();
  // adapt to common formats:
  const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.result || "";
  return String(text).trim();
}

function splitIntoFields(fullText) {
  // Try to heuristically separate into status/trend/warning/closing.
  // We don't require perfect splitting — we store raw text anyway.
  const lines = fullText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let status = lines[0] || "";
  let trend = lines[1] || "";
  let warning = lines[2] || "";
  let closing = lines.length > 0 ? lines[lines.length - 1] : "";

  // If closing is too long or duplicate, fallback to last 8 words
  if (!closing || closing.length > 80 || closing === status) {
    const words = fullText.split(/\s+/).filter(Boolean);
    closing = words.slice(-8).join(" ");
  }

  // Ensure fields are not identical
  if (!trend) trend = "";
  if (!warning) warning = "";
  return { status, trend, warning, closing };
}

async function main() {
  if (!fs.existsSync(PUBLIC_SEM_PATH)) {
    console.error(`Missing ${PUBLIC_SEM_PATH}. Please place public_semantics.json there first.`);
    process.exit(1);
  }

  const publicSem = JSON.parse(fs.readFileSync(PUBLIC_SEM_PATH, "utf-8"));
  const publicIds = Object.keys(publicSem);
  if (publicIds.length < 1) {
    console.error("public_semantics.json has no entries.");
    process.exit(1);
  }

  // Build combos array
  const combos = [];
  for (const main of publicIds) {
    for (const trend of publicIds) {
      for (const change of CHANGE_LEVELS) {
        combos.push({ main, trend, change });
        if (mode === "test" && combos.length >= testCount) break;
      }
      if (mode === "test" && combos.length >= testCount) break;
    }
    if (mode === "test" && combos.length >= testCount) break;
  }

  console.log(`Mode: ${mode}  | Total combos: ${combos.length}  | Concurrency: ${concurrency}`);

  // Load existing outputs (resume support)
  let results = {};
  if (fs.existsSync(OUTPUTS_PATH)) {
    try {
      results = JSON.parse(fs.readFileSync(OUTPUTS_PATH, "utf-8"));
      console.log("Loaded existing outputs, resuming. Existing keys:", Object.keys(results).length);
    } catch (e) {
      console.warn("Failed to parse existing outputs; starting fresh.");
      results = {};
    }
  }

  const queue = new PQueue({ concurrency });
  let generated = 0, skipped = 0;

  for (const combo of combos) {
    queue.add(async () => {
      const id = `${combo.main}_${combo.trend}_${combo.change}`;
      if (results[id]) {
        skipped++;
        return;
      }

      const mainSummary = publicSem[combo.main]?.summary || (publicSem[combo.main]?.keywords?.join(" ") || "");
      const trendSummary = publicSem[combo.trend]?.summary || (publicSem[combo.trend]?.keywords?.join(" ") || "");
      const changeSummary = combo.change === "C0" ? "整体稳定" : combo.change === "C1" ? "出现轻微变化" : "出现明显转变";

      const prompt = buildPrompt(mainSummary, trendSummary, changeSummary);

      // Retry logic
      const MAX_RETRIES = 3;
      let ok = false;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const raw = await callLLM(prompt);
          const parsed = splitIntoFields(raw);

          const record = {
            id,
            input: { main: combo.main, trend: combo.trend, change: combo.change },
            semantic: { main_summary: mainSummary, trend_summary: trendSummary, change_summary: changeSummary },
            output: { status: parsed.status, trend: parsed.trend, warning: parsed.warning, closing: parsed.closing },
            raw,
            created_at: new Date().toISOString()
          };

          results[id] = record;
          generated++;
          ok = true;

          if (generated % CHECKPOINT_EVERY === 0) {
            console.log(`Checkpoint: ${generated} generated — writing to disk.`);
            safeWriteJson(OUTPUTS_PATH, results);
          }
          break;
        } catch (err) {
          console.warn(`Attempt ${attempt} failed for ${id}:`, err.message || err);
          if (attempt < MAX_RETRIES) {
            await sleep(1500 * attempt); // backoff
          } else {
            // record error to avoid infinite retry loops
            results[id] = { id, input: combo, error: String(err), created_at: new Date().toISOString() };
            safeWriteJson(OUTPUTS_PATH, results);
          }
        }
      }
    }).catch(e => {
      console.error("Queue add error:", e);
    });
  }

  await queue.onIdle();

  // Final write
  safeWriteJson(OUTPUTS_PATH, results);
  console.log(`Done. Generated: ${generated}, Skipped: ${skipped}, Total records: ${Object.keys(results).length}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
