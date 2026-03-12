const cfg = window.BREAKOUT_ASSETS;

const sprites = {
  paddle: null,
  ball: null,
  background: null,
  blocks: null,
};

const spriteLoaded = {
  paddle: false,
  ball: false,
  background: false,
  blocks: false,
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
  loadSprite("paddle", cfg.images.paddle);
  loadSprite("ball", cfg.images.ball);
  loadSprite("background", cfg.images.background);
  loadSprite("blocks", cfg.images.blocks);
}

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const livesLabel = document.getElementById("lives-label");
const levelLabel = document.getElementById("level-label");

let gameState = "idle"; // idle | running | level-cleared | game-over
let score = 0;
let lives = 3;
let level = 1;

const paddle = {
  width: cfg.paddle.width,
  height: cfg.paddle.height,
  x: canvas.width / 2 - cfg.paddle.width / 2,
  y: canvas.height - cfg.paddle.height - 24,
  speed: cfg.paddle.speed,
  dir: 0,
};

const ball = {
  radius: cfg.ball.radius,
  x: canvas.width / 2,
  y: paddle.y - cfg.ball.radius - 2,
  vx: cfg.ball.speed * (Math.random() > 0.5 ? 1 : -1),
  vy: -cfg.ball.speed,
  stuckToPaddle: true,
};

let blocks = [];

function createBlocks() {
  blocks = [];
  const bcfg = cfg.blocks;
  const totalWidth =
    canvas.width - bcfg.leftOffset * 2 - (bcfg.cols - 1) * bcfg.padding;
  const blockWidth = totalWidth / bcfg.cols;
  const blockHeight = 20;

  for (let row = 0; row < bcfg.rows; row++) {
    for (let col = 0; col < bcfg.cols; col++) {
      const x =
        bcfg.leftOffset + col * (blockWidth + bcfg.padding);
      const y =
        bcfg.topOffset + row * (blockHeight + bcfg.padding);
      blocks.push({
        x,
        y,
        width: blockWidth,
        height: blockHeight,
        row,
        alive: true,
      });
    }
  }
}

createBlocks();
updateHud();

function resetBallAndPaddle() {
  paddle.x = canvas.width / 2 - paddle.width / 2;
  paddle.y = canvas.height - paddle.height - 24;
  ball.x = canvas.width / 2;
  ball.y = paddle.y - ball.radius - 2;
  ball.vx = cfg.ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = -cfg.ball.speed;
  ball.stuckToPaddle = true;
}

function updateHud() {
  scoreLabel.textContent = score;
  livesLabel.textContent = lives;
  levelLabel.textContent = level;
}

function update() {
  // Paddle
  paddle.x += paddle.dir * paddle.speed;
  if (paddle.x < 8) paddle.x = 8;
  if (paddle.x + paddle.width > canvas.width - 8) {
    paddle.x = canvas.width - 8 - paddle.width;
  }

  // Ball
  if (ball.stuckToPaddle) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
  } else {
    ball.x += ball.vx;
    ball.y += ball.vy;
  }

  // Colisiones con paredes
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx *= -1;
  } else if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.vx *= -1;
  }

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  }

  // Colisión con la pala
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.vy > 0
  ) {
    const hitPos = (ball.x - paddle.x) / paddle.width - 0.5; // -0.5 .. 0.5
    const angle = hitPos * (Math.PI / 3); // ±60°
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.vx = speed * Math.sin(angle);
    ball.vy = -Math.abs(speed * Math.cos(angle));
    ball.y = paddle.y - ball.radius - 1;
  }

  // Colisión con bloques
  for (const block of blocks) {
    if (!block.alive) continue;
    if (
      ball.x + ball.radius > block.x &&
      ball.x - ball.radius < block.x + block.width &&
      ball.y + ball.radius > block.y &&
      ball.y - ball.radius < block.y + block.height
    ) {
      block.alive = false;
      score += 10;
      // Determinar lado del impacto (simplificado)
      const overlapLeft = ball.x + ball.radius - block.x;
      const overlapRight =
        block.x + block.width - (ball.x - ball.radius);
      const overlapTop = ball.y + ball.radius - block.y;
      const overlapBottom =
        block.y + block.height - (ball.y - ball.radius);
      const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom
      );
      if (minOverlap === overlapLeft || minOverlap === overlapRight) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }
      break;
    }
  }

  // Comprobar fin de nivel (todos los bloques rotos)
  if (blocks.every((b) => !b.alive)) {
    level += 1;
    // Subimos un poco la velocidad
    ball.vx *= 1.1;
    ball.vy *= 1.1;
    createBlocks();
    resetBallAndPaddle();
    gameState = "level-cleared";
    messageText.textContent = "Nivel completado · pulsa jugar para seguir";
    playBtn.textContent = "Siguiente nivel";
    overlay.classList.remove("hidden");
  }

  // Bola cae
  if (ball.y - ball.radius > canvas.height) {
    lives -= 1;
    if (lives <= 0) {
      gameState = "game-over";
      messageText.textContent = "Game over · pulsa jugar para reiniciar";
      playBtn.textContent = "Reiniciar";
      overlay.classList.remove("hidden");
    } else {
      resetBallAndPaddle();
    }
  }

  updateHud();
}

function drawBackground() {
  if (sprites.background && spriteLoaded.background) {
    ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = cfg.background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = cfg.background.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
}

function drawPaddle() {
  ctx.save();
  ctx.translate(paddle.x, paddle.y);
  if (sprites.paddle && spriteLoaded.paddle) {
    ctx.drawImage(
      sprites.paddle,
      0,
      0,
      paddle.width,
      paddle.height
    );
  } else {
    ctx.fillStyle = cfg.paddle.color;
    ctx.fillRect(0, 0, paddle.width, paddle.height);
  }
  ctx.restore();
}

function drawBall() {
  ctx.save();
  if (sprites.ball && spriteLoaded.ball) {
    const size = ball.radius * 2;
    ctx.drawImage(
      sprites.ball,
      ball.x - ball.radius,
      ball.y - ball.radius,
      size,
      size
    );
  } else {
    ctx.fillStyle = cfg.ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBlocks() {
  const bcfg = cfg.blocks;
  for (const block of blocks) {
    if (!block.alive) continue;
    ctx.save();
    ctx.translate(block.x, block.y);
    if (sprites.blocks && spriteLoaded.blocks) {
      ctx.drawImage(
        sprites.blocks,
        0,
        0,
        block.width,
        block.height
      );
    } else {
      const color =
        bcfg.rowColors[block.row % bcfg.rowColors.length] ||
        "#f97316";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, block.width, block.height);
      ctx.strokeStyle = "rgba(15,23,42,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, block.width - 1, block.height - 1);
    }
    ctx.restore();
  }
}

function render() {
  drawBackground();
  drawBlocks();
  drawPaddle();
  drawBall();
}

function gameLoop() {
  if (gameState === "running") {
    update();
  }
  render();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (gameState === "game-over") {
    // reinicio completo
    score = 0;
    lives = 3;
    level = 1;
    createBlocks();
  }
  if (gameState === "level-cleared") {
    // ya se creó el nuevo nivel en update
  }
  resetBallAndPaddle();
  gameState = "running";
  overlay.classList.add("hidden");
  updateHud();
}

playBtn.addEventListener("click", () => {
  if (gameState === "running") return;
  startGame();
});

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") {
    paddle.dir = -1;
  } else if (e.code === "ArrowRight") {
    paddle.dir = 1;
  } else if (e.code === "Space") {
    if (gameState !== "running") {
      startGame();
    } else if (ball.stuckToPaddle) {
      ball.stuckToPaddle = false;
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (
    (e.code === "ArrowLeft" && paddle.dir === -1) ||
    (e.code === "ArrowRight" && paddle.dir === 1)
  ) {
    paddle.dir = 0;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  paddle.x = x - paddle.width / 2;
});

canvas.addEventListener("click", () => {
  if (gameState !== "running") {
    startGame();
  } else if (ball.stuckToPaddle) {
    ball.stuckToPaddle = false;
  }
});

gameLoop();

