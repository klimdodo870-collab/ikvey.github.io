const wheel = document.getElementById("wheel");
const labels = document.getElementById("labels");
const spinButton = document.getElementById("spinButton");
const result = document.getElementById("result");
const history = document.getElementById("history");

const coinsEl = document.getElementById("coins");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const xpText = document.getElementById("xpText");
const xpBar = document.getElementById("xpBar");

const rewards = [
  ["+10 coins", 10],
  ["+25 coins", 25],
  ["+50 coins", 50],
  ["+5 XP", 5],
  ["+100 coins", 100],
  ["+20 XP", 20],
  ["LOSE 10 coins", -10],
  ["JACKPOT +250", 250]
];

let coins = 100;
let xp = 0;
let level = 1;
let streak = 0;
let spins = 0;
let earned = 0;
let rotation = 0;
let busy = false;
let audioContext = null;
let lastTickIndex = 0;

function buildLabels() {
  rewards.forEach((reward, index) => {
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = reward[0];

    const angle = index * 45 + 22.5;
    label.style.transform =
      `rotate(${angle}deg) translateY(-155px)`;

    labels.appendChild(label);
  });
}

function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function tone(frequency, duration, volume, type = "square", delay = 0) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playTick() {
  tone(850, 0.045, 0.055, "square");
}

function playWinSound() {
  [523.25, 659.25, 783.99, 1046.5].forEach(
    (frequency, index) => {
      tone(frequency, 0.35, 0.18, "sine", index * 0.1);
    }
  );
}

function updateLevel() {
  const xpNeeded = level * 100;

  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
  }
}

function render() {
  updateLevel();

  coinsEl.textContent = coins;
  levelEl.textContent = level;
  streakEl.textContent = streak;

  const needed = level * 100;
  xpText.textContent = `${xp} / ${needed}`;
  xpBar.style.width =
    `${Math.min(100, (xp / needed) * 100)}%`;

  document.getElementById("p1").style.width =
    `${Math.min(100, spins * 100)}%`;
  document.getElementById("t1").textContent =
    `${Math.min(1, spins)} / 1`;

  document.getElementById("p2").style.width =
    `${Math.min(100, earned)}%`;
  document.getElementById("t2").textContent =
    `${Math.min(100, earned)} / 100`;

  document.getElementById("p3").style.width =
    `${Math.min(100, spins * 20)}%`;
  document.getElementById("t3").textContent =
    `${Math.min(5, spins)} / 5`;
}

function addHistory(text) {
  const item = document.createElement("div");
  item.textContent = text;
  history.prepend(item);

  while (history.children.length > 10) {
    history.lastElementChild.remove();
  }
}

function getWinnerIndex(rotationValue) {
  const slice = (Math.PI * 2) / rewards.length;

  let angle =
    (-Math.PI / 2 - rotationValue) %
    (Math.PI * 2);

  if (angle < 0) {
    angle += Math.PI * 2;
  }

  return Math.floor(angle / slice);
}

function spin() {
  if (busy || coins < 10) {
    if (coins < 10) {
      result.textContent = "😬 You need 10 coins to spin.";
    }
    return;
  }

  setupAudio();

  busy = true;
  spinButton.disabled = true;
  coins -= 10;
  spins++;
  streak++;

  result.textContent = "Spinning...";

  const startRotation = rotation;

  const fullSpins = 5 + Math.floor(Math.random() * 3);
  const randomAngle = Math.random() * Math.PI * 2;

  rotation =
    startRotation +
    fullSpins * Math.PI * 2 +
    randomAngle;

  wheel.style.transform = `rotate(${rotation}rad)`;

  const duration = 4700;
  const startTime = performance.now();

  function animate(time) {
    const progress = Math.min(
      1,
      (time - startTime) / duration
    );

    const currentRotation =
      startRotation +
      (rotation - startRotation) *
      (1 - Math.pow(1 - progress, 4));

    const currentIndex = Math.floor(
      ((currentRotation % (Math.PI * 2) +
        Math.PI * 2) %
        (Math.PI * 2)) /
        ((Math.PI * 2) / rewards.length)
    );

    if (currentIndex !== lastTickIndex) {
      playTick();
      lastTickIndex = currentIndex;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin() {
  const index = getWinnerIndex(rotation);
  const reward = rewards[index];
  const label = reward[0];
  const value = reward[1];

  if (value >= 0) {
    coins += value;
    earned += value;
  } else {
    coins = Math.max(0, coins + value);
  }

  xp += value > 0 ? Math.max(5, Math.floor(value / 5)) : 5;

  if (label.startsWith("LOSE")) {
    result.textContent = `😬 ${label}`;
  } else if (label.startsWith("JACKPOT")) {
    result.textContent = `💎 ${label}`;
  } else {
    result.textContent = `🎉 ${label}`;
  }

  addHistory(`Spin ${spins}: ${label}`);

  playWinSound();

  render();

  busy = false;
  spinButton.disabled = false;
}

spinButton.addEventListener("click", spin);

buildLabels();
render();
