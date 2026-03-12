// Lógica principal del juego Dino Runner.
// Sólo usa los valores de window.DINO_ASSETS para pintar, así es fácil cambiar el look.

const cfg = window.DINO_ASSETS;

const sprites = {
  dino: null,
  obstacle: null,
  background: null,
};

const spriteLoaded = {
  dino: false,
  obstacle: false,
  background: false,
};

function loadSprite(key, src) {
  if (!src) return;
  const img = new Image();
  img.src = src;
  img.onload = () => {
    spriteLoaded[key] = true;
  };
  sprites[key] = img;
}

if (cfg.images) {
  loadSprite("dino", cfg.images.dino);
  loadSprite("obstacle", cfg.images.obstacle);
  loadSprite("background", cfg.images.background);
}

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const bestLabel = document.getElementById("best-label");

const GRAVITY = 0.8;
const JUMP_VELOCITY = -13.5;
const SPEED_START = 7;
const SPEED_MAX = 15;
const SPEED_INCREMENT = 0.0008;

let gameState = "idle"; // idle | running | dead
let speed = SPEED_START;
let score = 0;
let bestScore = Number(localStorage.getItem("dino_best") || 0);
bestLabel.textContent = bestScore;

const groundY = canvas.height - cfg.background.groundHeight;

const dino = {
  x: 80,
  y: groundY - cfg.dino.height,
  width: cfg.dino.width,
  height: cfg.dino.height,
  vy: 0,
  onGround: true,
};

const obstacles = [];
let lastTime = 0;

function resetGame() {
  speed = SPEED_START;
  score = 0;
  obstacles.length = 0;
  dino.y = groundY - dino.height;
  dino.vy = 0;
  dino.onGround = true;
}

function spawnObstacle() {
  const h =
    cfg.obstacle.minHeight +
    Math.random() * (cfg.obstacle.maxHeight - cfg.obstacle.minHeight);
  const w = cfg.obstacle.baseWidth + Math.random() * 16;
  const x = canvas.width + 20;

  obstacles.push({
    x,
    y: groundY - h,
    width: w,
    height: h,
    hit: false,
  });
}

let distToNextObstacle = 260;

function update(dt) {
  const delta = Math.min(dt / 16.67, 2);

  speed = Math.min(SPEED_MAX, speed + SPEED_INCREMENT * dt);

  if (!dino.onGround) {
    dino.vy += GRAVITY * delta;
    dino.y += dino.vy * delta;
    if (dino.y >= groundY - dino.height) {
      dino.y = groundY - dino.height;
      dino.vy = 0;
      dino.onGround = true;
    }
  }

  distToNextObstacle -= speed * delta;
  if (distToNextObstacle <= 0) {
    spawnObstacle();
    const base = cfg.obstacle.gapMin;
    const extra = Math.random() * (cfg.obstacle.gapMax - cfg.obstacle.gapMin);
    distToNextObstacle = base + extra;
  }

  for (const obs of obstacles) {
    obs.x -= speed * delta;
  }
  while (obstacles.length && obstacles[0].x + obstacles[0].width < -40) {
    obstacles.shift();
  }

  score += 0.05 * delta;
  scoreLabel.textContent = Math.floor(score);

  for (const obs of obstacles) {
    if (rectsOverlap(dino, obs)) {
      gameOver();
      break;
    }
  }

  if (Math.floor(score) > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("dino_best", String(bestScore));
    bestLabel.textContent = bestScore;
  }
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function drawBackground() {
  const bg = cfg.background;

  // Si hay imagen de fondo, la usamos ocupando todo el canvas.
  if (sprites.background && spriteLoaded.background) {
    ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = bg.skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Suelo encima del fondo (para mantener el "ground" consistente).
  ctx.fillStyle = bg.groundColor;
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.strokeStyle = bg.lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 0.5);
  ctx.lineTo(canvas.width, groundY + 0.5);
  ctx.stroke();

  // Detalles extra si no tienes una imagen de fondo propia
  if (!bg.details || (sprites.background && spriteLoaded.background)) return;

  ctx.fillStyle = "#020617";
  drawMountain(60, groundY, 110, 42);
  drawMountain(200, groundY, 70, 28);
  drawMountain(400, groundY, 140, 46);

  ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
  for (let i = 0; i < 40; i++) {
    const x = (i * 41) % canvas.width;
    const y = 40 + (i * 19) % 90;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawMountain(x, baseY, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x + width / 2, baseY - height);
  ctx.lineTo(x + width, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawDino() {
  const d = cfg.dino;
  ctx.save();
  ctx.translate(dino.x, dino.y);

  if (sprites.dino && spriteLoaded.dino) {
    // Escalamos la imagen al alto configurado y ajustamos el ancho manteniendo proporción.
    const targetH = d.height;
    const ratio = sprites.dino.width / sprites.dino.height || 1;
    const targetW = targetH * ratio;
    ctx.drawImage(sprites.dino, 0, 0, targetW, targetH);
  } else {
    ctx.fillStyle = d.color;
    if (d.style === "round") {
      ctx.fillRect(0, 6, d.width * 0.75, d.height * 0.7);
      ctx.fillRect(d.width * 0.15, 0, d.width * 0.45, d.height * 0.5);
      ctx.beginPath();
      ctx.arc(d.width * 0.4, d.height * 0.9, d.width * 0.2, 0, Math.PI);
      ctx.fill();
    } else if (d.style === "robot") {
      ctx.fillRect(0, 6, d.width * 0.75, d.height * 0.76);
      ctx.fillRect(d.width * 0.2, -4, d.width * 0.45, d.height * 0.45);
      ctx.fillRect(d.width * 0.05, d.height * 0.76, d.width * 0.25, 6);
      ctx.fillRect(d.width * 0.45, d.height * 0.76, d.width * 0.25, 6);
    } else {
      ctx.fillRect(0, 8, d.width * 0.8, d.height * 0.7);
      ctx.fillRect(d.width * 0.45, 0, d.width * 0.4, d.height * 0.5);
      ctx.fillRect(d.width * 0.55, d.height * 0.5, d.width * 0.4, 8);
      ctx.fillRect(d.width * 0.15, d.height * 0.8, d.width * 0.25, 8);
      ctx.fillRect(d.width * 0.5, d.height * 0.8, d.width * 0.25, 8);
    }

    ctx.fillStyle = d.eyeColor;
    ctx.fillRect(d.width * 0.62, d.height * 0.18, 3, 3);
  }

  ctx.restore();
}

function drawObstacles() {
  const conf = cfg.obstacle;
  for (const obs of obstacles) {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    if (sprites.obstacle && spriteLoaded.obstacle) {
      const targetH = obs.height;
      const ratio = sprites.obstacle.width / sprites.obstacle.height || 1;
      const targetW = targetH * ratio;
      ctx.drawImage(sprites.obstacle, 0, 0, targetW, targetH);
    } else {
      ctx.fillStyle = obs.hit ? cfg.background.accentColor : conf.color;
      ctx.fillRect(0, 0, obs.width, obs.height);

      ctx.fillStyle = conf.accentColor;
      const spikes = Math.max(2, Math.round(obs.width / 6));
      for (let i = 0; i < spikes; i++) {
        const sx = (i * obs.width) / spikes + 2;
        ctx.fillRect(sx, 4, 2, 6 + (i % 2) * 4);
      }
    }

    ctx.restore();
  }
}

function render() {
  drawBackground();
  drawObstacles();
  drawDino();
}

function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (gameState === "running") {
    update(dt);
  }

  render();
  requestAnimationFrame(gameLoop);
}

function tryJump() {
  if (gameState === "idle") {
    startGame();
    return;
  }
  if (gameState !== "running") return;
  if (dino.onGround) {
    dino.vy = JUMP_VELOCITY;
    dino.onGround = false;
  }
}

function startGame() {
  resetGame();
  gameState = "running";
  overlay.classList.add("hidden");
}

function gameOver() {
  if (gameState !== "running") return;
  gameState = "dead";
  messageText.textContent = "Fin del juego · pulsa espacio para reintentar";
  playBtn.textContent = "Reintentar";
  overlay.classList.remove("hidden");
}

playBtn.addEventListener("click", () => {
  if (gameState === "running") return;
  startGame();
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (gameState === "dead") {
      startGame();
    } else {
      tryJump();
    }
  }
});

requestAnimationFrame(gameLoop);

