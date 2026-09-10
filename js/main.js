const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const startPauseBtn = document.getElementById("startPause");
const lapBtn = document.getElementById("lap");
const resetBtn = document.getElementById("reset");
const lapsEl = document.getElementById("laps");
const lapsEmptyEl = document.getElementById("lapsEmpty");
const ringSweep = document.getElementById("ringSweep");
const watchEl = document.querySelector(".watch");
const headsEl = document.getElementById("heads");

let headCount = 0;

const RING_CIRCUMFERENCE = 578;

let running = false;
let startedAt = 0;
let elapsedBefore = 0;
let rafId = null;
let laps = [];
let lastLapTime = 0;
let bestLapMs = null;

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const pad = (n) => String(n).padStart(2, "0");
  return { main: `${pad(minutes)}:${pad(seconds)}`, cs: pad(cs) };
}

function currentElapsed() {
  return running ? elapsedBefore + (performance.now() - startedAt) : elapsedBefore;
}

function render() {
  const elapsed = currentElapsed();
  const { main, cs } = formatTime(elapsed);
  timeEl.innerHTML = `${main}<small>.${cs}</small>`;

  const secondsInLoop = (elapsed / 1000) % 60;
  const offset = RING_CIRCUMFERENCE - (secondsInLoop / 60) * RING_CIRCUMFERENCE;
  ringSweep.style.strokeDashoffset = offset;

  const newHeadCount = Math.floor(elapsed / 10000);
  if (newHeadCount !== headCount) {
    headCount = newHeadCount;
    renderHeads();
  }
}

function renderHeads() {
  headsEl.innerHTML = "";
  for (let i = 0; i < headCount; i++) {
    const img = document.createElement("img");
    img.src = "img/head-gif.gif";
    img.alt = "";
    headsEl.appendChild(img);
  }
}

function tick() {
  render();
  if (running) {
    rafId = requestAnimationFrame(tick);
  }
}

function start() {
  running = true;
  startedAt = performance.now();
  watchEl.dataset.running = "true";
  startPauseBtn.dataset.running = "true";
  startPauseBtn.textContent = "Pausar";
  statusEl.textContent = "Em andamento";
  lapBtn.disabled = false;
  tick();
}

function pause() {
  running = false;
  elapsedBefore = currentElapsed();
  cancelAnimationFrame(rafId);
  watchEl.dataset.running = "false";
  startPauseBtn.dataset.running = "false";
  startPauseBtn.textContent = "Retomar";
  statusEl.textContent = "Pausado";
  lapBtn.disabled = true;
}

function reset() {
  running = false;
  cancelAnimationFrame(rafId);
  elapsedBefore = 0;
  laps = [];
  lastLapTime = 0;
  bestLapMs = null;
  headCount = 0;
  watchEl.dataset.running = "false";
  startPauseBtn.dataset.running = "false";
  startPauseBtn.textContent = "Iniciar";
  statusEl.textContent = "Parado";
  lapBtn.disabled = true;
  renderLaps();
  renderHeads();
  render();
}

function addLap() {
  const total = currentElapsed();
  const split = total - lastLapTime;
  lastLapTime = total;
  if (bestLapMs === null || split < bestLapMs) {
    bestLapMs = split;
  }
  laps.unshift({ n: laps.length + 1, split, total });
  renderLaps();
}

function renderLaps() {
  lapsEl.querySelectorAll(".laps__row").forEach((row) => row.remove());
  lapsEmptyEl.style.display = laps.length ? "none" : "block";

  laps.forEach((lap) => {
    const li = document.createElement("li");
    li.className = "laps__row";
    if (lap.split === bestLapMs && laps.length > 1) {
      li.classList.add("laps__row--best");
    }
    const { main: splitMain, cs: splitCs } = formatTime(lap.split);
    const { main: totalMain, cs: totalCs } = formatTime(lap.total);
    li.innerHTML = `<span>Volta ${lap.n} · ${splitMain}.${splitCs}</span><span>${totalMain}.${totalCs}</span>`;
    lapsEl.appendChild(li);
  });
}

startPauseBtn.addEventListener("click", () => {
  running ? pause() : start();
});

lapBtn.addEventListener("click", addLap);
resetBtn.addEventListener("click", reset);

render();
