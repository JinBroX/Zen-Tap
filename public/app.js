let ZEN_OUTPUTS = null;
let PUBLIC_SEMANTICS = null;

// 加载大占卜文本
async function loadZenOutputs() {
  if (!ZEN_OUTPUTS) {
    const res = await fetch('data/zen_outputs.json');
    ZEN_OUTPUTS = await res.json();
  }
  return ZEN_OUTPUTS;
}

// 加载语义（public_semantics）
async function loadSemantics() {
  if (!PUBLIC_SEMANTICS) {
    const res = await fetch('data/public_semantics.json');
    PUBLIC_SEMANTICS = await res.json();
  }
  return PUBLIC_SEMANTICS;
}

// 这里临时使用随机 64 卦（先跑起来）
const HEXAGRAMS = [
  "乾","坤","屯","蒙","需","讼","师","比","小畜","履","泰","否","同人","大有",
  "谦","豫","随","蛊","临","观","噬嗑","贲","剥","复","无妄","大畜","颐","大过",
  "坎","离","咸","恒","遁","大壮","晋","明夷","家人","睽","蹇","解","损","益",
  "夬","姤","萃","升","困","井","革","鼎","震","艮","渐","归妹","丰","旅","巽",
  "兑","涣","节","中孚","小过","既济","未济"
];

// 生成合法卦名
function computeHexagram() {
  const main = HEXAGRAMS[Math.floor(Math.random()*64)];
  const trend = HEXAGRAMS[Math.floor(Math.random()*64)];
  const change = HEXAGRAMS[Math.floor(Math.random()*64)];
  return { main, trend, change };
}

// 查找结果
async function getZenResult(main, trend, change) {

  const outputs = await loadZenOutputs();
  const semantics = await loadSemantics();

  return {
    main: semantics[main] || null,
    trend: semantics[trend] || null,
    change: semantics[change] || null
  };
}

document.getElementById("scanBtn").onclick = async () => {
  const { main, trend, change } = computeHexagram();
  const result = await getZenResult(main, trend, change);

  if (!result.main) return alert("没有匹配结果");

  document.getElementById("status").textContent = result.main.modern_meaning;
  document.getElementById("trend").textContent = result.trend.core_imagery;
  document.getElementById("warning").textContent = result.change.guidance;
  document.getElementById("closing").textContent = "—— Zen-Tap 语义生成";

  document.getElementById("resultBox").classList.remove("hidden");
};
