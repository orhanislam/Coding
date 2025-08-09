/* Flappy Bird - Vanilla JS Canvas */

const CONFIG = {
  worldWidthCssPx: 420,
  worldHeightCssPx: 672,
  gravityPxPerSec2: 1900,
  flapImpulsePxPerSec: -520,
  pipeSpeedPxPerSec: 180,
  pipeWidthPx: 70,
  pipeGapPx: 170,
  spawnIntervalMs: 1400,
  minGapTopPx: 80,
  minGapBottomPx: 120,
  birdXCssPx: 120,
  maxFallSpeedPxPerSec: 900,
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const overlayEl = document.getElementById("overlay");

let devicePixelRatioScale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

let state = {
  gameState: "ready", // ready | playing | gameover
  bird: { x: CONFIG.birdXCssPx, y: 0, radius: 16, velocityY: 0 },
  pipes: [], // { x, gapY, scored }
  lastSpawnMs: 0,
  timeMs: 0,
  score: 0,
  highScore: Number(localStorage.getItem("flappy_best") || 0),
};

function setTextScores() {
  scoreEl.textContent = String(state.score);
  highScoreEl.textContent = `Best: ${state.highScore}`;
}

function resizeCanvasToDisplaySize() {
  const targetCssWidth = Math.min(window.innerWidth * 0.92, 560);
  const targetCssHeight = Math.min(targetCssWidth * (CONFIG.worldHeightCssPx / CONFIG.worldWidthCssPx), window.innerHeight * 0.92);

  const cssWidth = Math.floor(targetCssWidth);
  const cssHeight = Math.floor(targetCssHeight);

  devicePixelRatioScale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  const internalWidth = Math.floor(cssWidth * devicePixelRatioScale);
  const internalHeight = Math.floor(cssHeight * devicePixelRatioScale);

  canvas.width = internalWidth;
  canvas.height = internalHeight;

  ctx.setTransform(devicePixelRatioScale, 0, 0, devicePixelRatioScale, 0, 0);
}

function resetGame() {
  state.gameState = "ready";
  state.bird.y = CONFIG.worldHeightCssPx / 2;
  state.bird.velocityY = 0;
  state.pipes = [];
  state.score = 0;
  state.timeMs = 0;
  state.lastSpawnMs = -CONFIG.spawnIntervalMs;
  overlayEl.classList.remove("hidden");
  setTextScores();
}

function startGame() {
  if (state.gameState === "playing") return;
  state.gameState = "playing";
  overlayEl.classList.add("hidden");
  state.timeMs = 0;
  state.lastSpawnMs = 0;
}

function gameOver() {
  state.gameState = "gameover";
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("flappy_best", String(state.highScore));
  }
  overlayEl.classList.remove("hidden");
  setTextScores();
}

function spawnPipe() {
  const availableGapTop = CONFIG.minGapTopPx + CONFIG.pipeGapPx / 2;
  const availableGapBottom = CONFIG.worldHeightCssPx - CONFIG.minGapBottomPx - CONFIG.pipeGapPx / 2;
  const gapY = randRange(availableGapTop, availableGapBottom);

  const rightEdgeX = cssToWorldWidth();
  state.pipes.push({ x: rightEdgeX + CONFIG.pipeWidthPx, gapY, scored: false });
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function cssToWorldWidth() {
  // Our world units equal CSS pixels at 1x; canvas DPR scaling is handled via transform.
  const displayWidthCss = parseFloat(getComputedStyle(canvas).width);
  return displayWidthCss || CONFIG.worldWidthCssPx;
}

function update(dtSec) {
  if (state.gameState !== "playing") return;

  // Bird physics
  state.bird.velocityY += CONFIG.gravityPxPerSec2 * dtSec;
  state.bird.velocityY = Math.min(state.bird.velocityY, CONFIG.maxFallSpeedPxPerSec);
  state.bird.y += state.bird.velocityY * dtSec;

  // Spawn pipes
  state.timeMs += dtSec * 1000;
  if (state.timeMs - state.lastSpawnMs >= CONFIG.spawnIntervalMs) {
    spawnPipe();
    state.lastSpawnMs = state.timeMs;
  }

  // Move pipes and score
  const speed = CONFIG.pipeSpeedPxPerSec * dtSec;
  for (let i = 0; i < state.pipes.length; i += 1) {
    const pipe = state.pipes[i];
    pipe.x -= speed;

    if (!pipe.scored && pipe.x + CONFIG.pipeWidthPx < state.bird.x) {
      pipe.scored = true;
      state.score += 1;
      setTextScores();
    }
  }

  // Remove offscreen pipes
  state.pipes = state.pipes.filter(p => p.x + CONFIG.pipeWidthPx > -10);

  // Collisions with bounds
  if (state.bird.y - state.bird.radius < 0) {
    state.bird.y = state.bird.radius;
    gameOver();
  }
  const groundY = CONFIG.worldHeightCssPx - 4;
  if (state.bird.y + state.bird.radius > groundY) {
    state.bird.y = groundY - state.bird.radius;
    gameOver();
  }

  // Collisions with pipes
  const birdLeft = state.bird.x - state.bird.radius;
  const birdRight = state.bird.x + state.bird.radius;
  for (const pipe of state.pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + CONFIG.pipeWidthPx;
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      const gapTop = pipe.gapY - CONFIG.pipeGapPx / 2;
      const gapBottom = pipe.gapY + CONFIG.pipeGapPx / 2;
      if (state.bird.y - state.bird.radius < gapTop || state.bird.y + state.bird.radius > gapBottom) {
        gameOver();
        break;
      }
    }
  }
}

function render() {
  const widthCss = cssToWorldWidth();
  const heightCss = CONFIG.worldHeightCssPx;

  // sky background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, heightCss);
  gradient.addColorStop(0, "#8ec5fc");
  gradient.addColorStop(1, "#e0c3fc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, widthCss, heightCss);

  // ground line
  ctx.fillStyle = "#6c5ce7";
  ctx.fillRect(0, heightCss - 4, widthCss, 4);

  // pipes
  for (const pipe of state.pipes) {
    const gapTop = pipe.gapY - CONFIG.pipeGapPx / 2;
    const gapBottom = pipe.gapY + CONFIG.pipeGapPx / 2;

    ctx.fillStyle = "#2ecc71";
    // Top pipe
    ctx.fillRect(pipe.x, 0, CONFIG.pipeWidthPx, Math.max(0, gapTop));
    // Bottom pipe
    ctx.fillRect(pipe.x, gapBottom, CONFIG.pipeWidthPx, heightCss - gapBottom - 4);

    // Pipe lips
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(pipe.x - 2, Math.max(0, gapTop) - 10, CONFIG.pipeWidthPx + 4, 10);
    ctx.fillRect(pipe.x - 2, gapBottom, CONFIG.pipeWidthPx + 4, 10);
  }

  // bird
  drawBird(state.bird.x, state.bird.y, state.bird.radius, state.bird.velocityY);

  // overlay messaging handled by DOM
}

function drawBird(x, y, r, vy) {
  ctx.save();
  const angle = Math.max(-0.4, Math.min(0.6, vy / 800));
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Body
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = "#f7dc6f";
  ctx.beginPath();
  ctx.arc(-4, 4, r * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.arc(r * 0.52, -r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.moveTo(r * 0.9, 0);
  ctx.lineTo(r * 1.4, -r * 0.12);
  ctx.lineTo(r * 1.4, r * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function flap() {
  if (state.gameState === "ready") startGame();
  if (state.gameState !== "playing") return;
  state.bird.velocityY = CONFIG.flapImpulsePxPerSec;
}

function onPointerDown(e) {
  e.preventDefault();
  if (state.gameState === "gameover") {
    resetGame();
    return;
  }
  flap();
}

function onKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (state.gameState === "gameover") {
      resetGame();
      return;
    }
    flap();
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    resetGame();
  }
}

let prevTimestamp = 0;
function loop(ts) {
  if (!prevTimestamp) prevTimestamp = ts;
  const dtSec = Math.min(0.033, (ts - prevTimestamp) / 1000);
  prevTimestamp = ts;

  update(dtSec);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvasToDisplaySize);
window.addEventListener("orientationchange", resizeCanvasToDisplaySize);
window.addEventListener("keydown", onKeyDown, { passive: false });
window.addEventListener("mousedown", onPointerDown, { passive: false });
window.addEventListener("touchstart", onPointerDown, { passive: false });

// Init
resizeCanvasToDisplaySize();
resetGame();
setTextScores();
requestAnimationFrame(loop);