const cfg = window.SNAKE_ASSETS;

const canvas = document.getElementById("game-canvas");
canvas.width = cfg.grid.cols * cfg.grid.cellSize;
canvas.height = cfg.grid.rows * cfg.grid.cellSize;
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const bestLabel = document.getElementById("best-label");
const lengthLabel = document.getElementById("length-label");

let gameState = "idle";
let score = 0;
let bestScore = Number(localStorage.getItem("snake_best") || 0);
bestLabel.textContent = bestScore;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let apple = null;
let goldenApple = null;
let goldenTimer = 0;
let speed = cfg.snake.speed;
let lastMove = 0;
let animFrame = 0;

const particles = [];

function resetGame() {
  score = 0;
  speed = cfg.snake.speed;
  scoreLabel.textContent = 0;
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  goldenApple = null;
  goldenTimer = 0;
  particles.length = 0;

  const startX = Math.floor(cfg.grid.cols / 4);
  const startY = Math.floor(cfg.grid.rows / 2);
  snake = [];
  for (let i = cfg.snake.initialLength - 1; i >= 0; i--) {
    snake.push({ x: startX - i, y: startY });
  }
  lengthLabel.textContent = snake.length;

  placeApple();
}

function placeApple() {
  const free = [];
  for (let x = 0; x < cfg.grid.cols; x++) {
    for (let y = 0; y < cfg.grid.rows; y++) {
      if (!snake.some((s) => s.x === x && s.y === y)) {
        if (!goldenApple || goldenApple.x !== x || goldenApple.y !== y) {
          free.push({ x, y });
        }
      }
    }
  }
  if (free.length === 0) {
    gameOver();
    return;
  }
  apple = free[Math.floor(Math.random() * free.length)];
}

function placeGolden() {
  if (goldenApple) return;
  const free = [];
  for (let x = 0; x < cfg.grid.cols; x++) {
    for (let y = 0; y < cfg.grid.rows; y++) {
      if (
        !snake.some((s) => s.x === x && s.y === y) &&
        !(apple && apple.x === x && apple.y === y)
      ) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return;
  goldenApple = free[Math.floor(Math.random() * free.length)];
  goldenTimer = cfg.golden.duration;
}

function spawnParticles(cx, cy, color) {
  const cs = cfg.grid.cellSize;
  const px = cx * cs + cs / 2;
  const py = cy * cs + cs / 2;
  for (let i = 0; i < cfg.particles.count; i++) {
    const angle = (Math.PI * 2 * i) / cfg.particles.count + Math.random() * 0.4;
    const spd = 1.5 + Math.random() * 3;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: 2 + Math.random() * 3,
      color: color || cfg.particles.colors[i % cfg.particles.colors.length],
      life: 1,
    });
  }
}

function update(dt) {
  animFrame += dt * 0.004;

  if (goldenApple) {
    goldenTimer -= dt;
    if (goldenTimer <= 0) {
      goldenApple = null;
    }
  }

  lastMove += dt;
  if (lastMove < speed) return;
  lastMove = 0;

  direction = { ...nextDirection };

  const head = snake[snake.length - 1];
  const nx = head.x + direction.x;
  const ny = head.y + direction.y;

  if (nx < 0 || nx >= cfg.grid.cols || ny < 0 || ny >= cfg.grid.rows) {
    gameOver();
    return;
  }

  if (snake.some((s) => s.x === nx && s.y === ny)) {
    gameOver();
    return;
  }

  snake.push({ x: nx, y: ny });

  let ate = false;
  if (apple && nx === apple.x && ny === apple.y) {
    score += cfg.apple.score;
    scoreLabel.textContent = score;
    spawnParticles(nx, ny, cfg.apple.color);
    placeApple();
    ate = true;
    speed = Math.max(cfg.snake.minSpeed, speed - cfg.snake.speedIncrease);

    if (!goldenApple && Math.random() < cfg.golden.chance) {
      placeGolden();
    }
  } else if (goldenApple && nx === goldenApple.x && ny === goldenApple.y) {
    score += cfg.golden.score;
    scoreLabel.textContent = score;
    spawnParticles(nx, ny, cfg.golden.color);
    goldenApple = null;
    ate = true;
  }

  if (!ate) {
    snake.shift();
  }

  lengthLabel.textContent = snake.length;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake_best", String(bestScore));
    bestLabel.textContent = bestScore;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= dt / cfg.particles.duration;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawGrid() {
  const cs = cfg.grid.cellSize;
  ctx.fillStyle = cfg.grid.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = cfg.grid.gridLineColor;
  ctx.lineWidth = 1;
  for (let x = 0; x <= cfg.grid.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cs + 0.5, 0);
    ctx.lineTo(x * cs + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= cfg.grid.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cs + 0.5);
    ctx.lineTo(canvas.width, y * cs + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = cfg.grid.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

function drawSnake() {
  const cs = cfg.grid.cellSize;
  const pad = 2;

  for (let i = 0; i < snake.length; i++) {
    const seg = snake[i];
    const isHead = i === snake.length - 1;
    const ratio = i / snake.length;

    ctx.save();

    if (isHead) {
      ctx.shadowColor = cfg.snake.glowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = cfg.snake.headColor;
    } else {
      ctx.fillStyle = i % 2 === 0 ? cfg.snake.bodyColor : cfg.snake.bodyColorAlt;
    }

    const x = seg.x * cs + pad;
    const y = seg.y * cs + pad;
    const s = cs - pad * 2;
    const r = isHead ? s * 0.35 : s * 0.25 + ratio * 0.1 * s;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + s - r, y);
    ctx.quadraticCurveTo(x + s, y, x + s, y + r);
    ctx.lineTo(x + s, y + s - r);
    ctx.quadraticCurveTo(x + s, y + s, x + s - r, y + s);
    ctx.lineTo(x + r, y + s);
    ctx.quadraticCurveTo(x, y + s, x, y + s - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    if (isHead) {
      ctx.shadowBlur = 0;
      const cx = seg.x * cs + cs / 2;
      const cy = seg.y * cs + cs / 2;
      const eyeOff = cs * 0.22;
      const eyeR = cs * 0.1;
      const pupilR = cs * 0.05;

      let e1x, e1y, e2x, e2y;
      if (direction.x === 1) {
        e1x = cx + eyeOff * 0.5; e1y = cy - eyeOff;
        e2x = cx + eyeOff * 0.5; e2y = cy + eyeOff;
      } else if (direction.x === -1) {
        e1x = cx - eyeOff * 0.5; e1y = cy - eyeOff;
        e2x = cx - eyeOff * 0.5; e2y = cy + eyeOff;
      } else if (direction.y === -1) {
        e1x = cx - eyeOff; e1y = cy - eyeOff * 0.5;
        e2x = cx + eyeOff; e2y = cy - eyeOff * 0.5;
      } else {
        e1x = cx - eyeOff; e1y = cy + eyeOff * 0.5;
        e2x = cx + eyeOff; e2y = cy + eyeOff * 0.5;
      }

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cfg.snake.eyeColor;
      ctx.beginPath();
      ctx.arc(e1x + direction.x * 1.5, e1y + direction.y * 1.5, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x + direction.x * 1.5, e2y + direction.y * 1.5, pupilR, 0, Math.PI * 2);
      ctx.fill();

      const tongueLen = 6 + Math.sin(animFrame * 3) * 2;
      ctx.strokeStyle = cfg.snake.tongueColor;
      ctx.lineWidth = 1.5;
      const tx = cx + direction.x * (cs / 2 + 2);
      const ty = cy + direction.y * (cs / 2 + 2);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      if (direction.x !== 0) {
        ctx.lineTo(tx + direction.x * tongueLen, ty);
        ctx.moveTo(tx + direction.x * tongueLen, ty);
        ctx.lineTo(tx + direction.x * (tongueLen + 3), ty - 3);
        ctx.moveTo(tx + direction.x * tongueLen, ty);
        ctx.lineTo(tx + direction.x * (tongueLen + 3), ty + 3);
      } else {
        ctx.lineTo(tx, ty + direction.y * tongueLen);
        ctx.moveTo(tx, ty + direction.y * tongueLen);
        ctx.lineTo(tx - 3, ty + direction.y * (tongueLen + 3));
        ctx.moveTo(tx, ty + direction.y * tongueLen);
        ctx.lineTo(tx + 3, ty + direction.y * (tongueLen + 3));
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawApple(a, color, glowColor, isGolden) {
  const cs = cfg.grid.cellSize;
  const cx = a.x * cs + cs / 2;
  const cy = a.y * cs + cs / 2;
  const r = cs * 0.38;
  const pulse = 1 + Math.sin(animFrame * (isGolden ? 8 : 4)) * 0.06;

  ctx.save();

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14 * pulse;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = cfg.apple.shineSColor;
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.25, r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cfg.apple.stemColor;
  ctx.fillRect(cx - 1.5, cy - r - 5, 3, 7);

  ctx.fillStyle = cfg.apple.leafColor;
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - r - 2, 5, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();

  if (isGolden && goldenTimer < 2000) {
    const blink = Math.sin(animFrame * 15) > 0;
    if (!blink) {
      ctx.globalAlpha = 0.3;
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawApples() {
  if (apple) {
    drawApple(apple, cfg.apple.color, cfg.apple.glowColor, false);
  }
  if (goldenApple) {
    drawApple(goldenApple, cfg.golden.color, cfg.golden.glowColor, true);
  }
}

function drawParticles() {
  for (const p of particles) {
    if (p.life <= 0) continue;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function render() {
  drawGrid();
  drawApples();
  drawSnake();
  drawParticles();
}

let prevTimestamp = 0;
function gameLoop(timestamp) {
  if (prevTimestamp === 0) prevTimestamp = timestamp;
  const dt = timestamp - prevTimestamp;
  prevTimestamp = timestamp;

  if (gameState === "running") {
    update(dt);
    updateParticles(dt);
  }

  render();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  resetGame();
  gameState = "running";
  overlay.classList.add("hidden");
  lastMove = 0;
}

function gameOver() {
  if (gameState !== "running") return;
  gameState = "dead";

  for (const seg of snake) {
    spawnParticles(seg.x, seg.y);
  }

  messageText.textContent = `Game Over · ${score} puntos · Largo ${snake.length}`;
  playBtn.textContent = "Reintentar";
  overlay.classList.remove("hidden");
}

playBtn.addEventListener("click", () => {
  if (gameState === "running") return;
  startGame();
});

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }

  if ((e.code === "Space" || e.code === "Enter") && gameState !== "running") {
    startGame();
    return;
  }

  if (gameState !== "running") return;

  if ((e.code === "ArrowUp" || e.code === "KeyW") && direction.y === 0) {
    nextDirection = { x: 0, y: -1 };
  } else if ((e.code === "ArrowDown" || e.code === "KeyS") && direction.y === 0) {
    nextDirection = { x: 0, y: 1 };
  } else if ((e.code === "ArrowLeft" || e.code === "KeyA") && direction.x === 0) {
    nextDirection = { x: -1, y: 0 };
  } else if ((e.code === "ArrowRight" || e.code === "KeyD") && direction.x === 0) {
    nextDirection = { x: 1, y: 0 };
  }
});

requestAnimationFrame(gameLoop);
