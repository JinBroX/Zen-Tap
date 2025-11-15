let ZEN_OUTPUTS = null;

async function loadZenOutputs() {
  if (ZEN_OUTPUTS) return ZEN_OUTPUTS;

  const res = await fetch('data/zen_outputs.json');
  ZEN_OUTPUTS = await res.json();
  return ZEN_OUTPUTS;
}

function getRandomID() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += c[Math.floor(Math.random()*c.length)];
  return id;
}

function computeHexagram() {
  return {
    main: getRandomID(),
    trend: getRandomID(),
    change: Math.floor(Math.random() * 3),
  };
}

async function getZenResult(main, trend, change) {
  const outputs = await loadZenOutputs();
  return outputs[`${main}_${trend}_${change}`];
}

document.getElementById("scanBtn").onclick = async () => {
  const { main, trend, change } = computeHexagram();
  const result = await getZenResult(main, trend, change);

  if (!result) return alert("没有匹配结果");

  document.getElementById("status").textContent = result.output.status;
  document.getElementById("trend").textContent = result.output.trend;
  document.getElementById("warning").textContent = result.output.warning;
  document.getElementById("closing").textContent = result.output.closing;

  document.getElementById("resultBox").classList.remove("hidden");
};
