const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const result = document.getElementById("result");

const options = [
  "Pizza",
  "Burger",
  "Sushi",
  "Tacos",
  "Pasta",
  "Curry"
];

const colors = [
  "#ff6b6b",
  "#feca57",
  "#48dbfb",
  "#1dd1a1",
  "#5f27cd",
  "#ff9ff3"
];

let rotation = 0;
let spinning = false;

// ==============================
// SOUND SYSTEM
// ==============================

let audioContext;

function setupAudio() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

// Short clicking/ticking sound
function playTick() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(
    900,
    audioContext.currentTime
  );

  gain.gain.setValueAtTime(
    0.08,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.04
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.04);
}

// Winning sound
function playWinSound() {
  if (!audioContext) return;

  const notes = [
    { frequency: 523.25, delay: 0 },
    { frequency: 659.25, delay: 0.12 },
    { frequency: 783.99, delay: 0.24 },
    { frequency: 1046.50, delay: 0.36 }
  ];

  notes.forEach(note => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      note.frequency,
      audioContext.currentTime + note.delay
    );

    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime + note.delay
    );

    gain.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + note.delay + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + note.delay + 0.35
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + note.delay);
    oscillator.stop(audioContext.currentTime + note.delay + 0.35);
  });
}

// ==============================
// DRAW THE WHEEL
// ==============================

function drawWheel() {
  const center = canvas.width / 2;
  const radius = center;
  const slice = (2 * Math.PI) / options.length;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  options.forEach((option, i) => {
    const start = rotation + i * slice;
    const end = start + slice;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(center, center);

    ctx.arc(
      center,
      center,
      radius,
      start,
      end
    );

    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw text
    ctx.save();

    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right";

    ctx.fillText(
      option,
      radius - 25,
      7
    );

    ctx.restore();
  });
}

// ==============================
// SPIN THE WHEEL
// ==============================

function spin() {
  if (spinning) return;

  // Browser allows audio after a user click
  setupAudio();

  spinning = true;
  spinButton.disabled = true;
  result.textContent = "";

  const startRotation = rotation;

  // Number of full rotations
  const fullSpins =
    5 + Math.floor(Math.random() * 5);

  // Random final position
  const randomAngle =
    Math.random() * Math.PI * 2;

  const targetRotation =
    startRotation +
    fullSpins * Math.PI * 2 +
    randomAngle;

  const duration = 5000;
  const startTime = performance.now();

  let lastSlice = Math.floor(
    rotation /
    ((2 * Math.PI) / options.length)
  );

  function animate(currentTime) {
    const elapsed =
      currentTime - startTime;

    const progress =
      Math.min(elapsed / duration, 1);

    // Smooth slow-down
    const easeOut =
      1 - Math.pow(1 - progress, 4);

    rotation =
      startRotation +
      (targetRotation - startRotation) *
      easeOut;

    drawWheel();

    // ==========================
    // PLAY TICK SOUNDS
    // ==========================

    const slice =
      (2 * Math.PI) / options.length;

    const currentSlice =
      Math.floor(rotation / slice);

    if (currentSlice !== lastSlice) {
      playTick();
      lastSlice = currentSlice;
    }

    // Continue animation
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

// ==============================
// FINISH SPIN
// ==============================

function finishSpin() {
  spinning = false;
  spinButton.disabled = false;

  const slice =
    (2 * Math.PI) / options.length;

  // Pointer is at the top
  let angle =
    (-Math.PI / 2 - rotation) %
    (Math.PI * 2);

  if (angle < 0) {
    angle += Math.PI * 2;
  }

  const index =
    Math.floor(angle / slice);

  const winner = options[index];

  result.textContent =
    `🎉 You got: ${winner}!`;

  // Celebration sound
  playWinSound();
}

// ==============================
// BUTTON
// ==============================

spinButton.addEventListener(
  "click",
  spin
);

// Draw initial wheel
drawWheel();