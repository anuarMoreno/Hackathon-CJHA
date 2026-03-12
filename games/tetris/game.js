const cfg = window.TETRIS_ASSETS;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const linesLabel = document.getElementById("lines-label");
const levelLabel = document.getElementById("level-label");

// Sprites opcionales
const sprites = {
  cell: null,
  background: null,
};
const spriteLoaded = {
  cell: false,
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
  loadSprite("cell", cfg.images.cell);
  loadSprite("background", cfg.images.background);
}

const COLS = cfg.board.cols;
const ROWS = cfg.board.rows;
const SIZE = cfg.board.cellSize;

// Aseguramos que el canvas coincida con la config
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

let board = createEmptyBoard();

let gameState = "idle"; // idle | running | game-over
let score = 0;
let lines = 0;
let level = 1;
let dropInterval = 800; // ms
let lastDropTime = 0;

const pieces = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  L: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  J: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
  ],
};

const pieceTypes = Object.keys(pieces);

let current = null;

function createEmptyBoard() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(null);
    grid.push(row);
  }
  return grid;
}

function spawnPiece() {
  const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
  current = {
    type,
    rotation: 0,
    x: 3,
    y: 0,
  };
  if (collides(current, board)) {
    gameOver();
  }
}

function getBlocks(piece) {
  const shape = pieces[piece.type][piece.rotation];
  return shape.map(([x, y]) => ({
    x: x + piece.x,
    y: y + piece.y,
  }));
}

function collides(piece, grid) {
  const cells = getBlocks(piece);
  for (const c of cells) {
    if (c.x < 0 || c.x >= COLS || c.y >= ROWS) return true;
    if (c.y >= 0 && grid[c.y][c.x]) return true;
  }
  return false;
}

function mergePiece() {
  const cells = getBlocks(current);
  for (const c of cells) {
    if (c.y >= 0 && c.y < ROWS && c.x >= 0 && c.x < COLS) {
      board[c.y][c.x] = current.type;
    }
  }
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((cell) => cell)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }
  if (cleared > 0) {
    // Puntuación simple estilo Tetris clásico
    const pointsTable = { 1: 100, 2: 300, 3: 500, 4: 800 };
    score += pointsTable[cleared] || 0;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    dropInterval = Math.max(120, 800 - (level - 1) * 60);
  }
}

function hardDrop() {
  if (!current) return;
  while (true) {
    const test = { ...current, y: current.y + 1 };
    if (collides(test, board)) break;
    current.y++;
  }
  tickDown();
}

function softDrop() {
  if (!current) return;
  const test = { ...current, y: current.y + 1 };
  if (!collides(test, board)) {
    current.y++;
    score += 1;
  } else {
    tickDown();
  }
}

function tickDown() {
  const test = { ...current, y: current.y + 1 };
  if (!collides(test, board)) {
    current.y++;
  } else {
    mergePiece();
    clearLines();
    spawnPiece();
  }
}

function move(dx) {
  if (!current) return;
  const test = { ...current, x: current.x + dx };
  if (!collides(test, board)) {
    current.x = test.x;
  }
}

function rotate() {
  if (!current) return;
  const variants = pieces[current.type];
  const nextRot = (current.rotation + 1) % variants.length;
  const test = { ...current, rotation: nextRot };
  if (!collides(test, board)) {
    current.rotation = nextRot;
  } else {
    // pequeños "wall kicks" básicos
    const testLeft = { ...test, x: test.x - 1 };
    const testRight = { ...test, x: test.x + 1 };
    if (!collides(testLeft, board)) {
      current.x = testLeft.x;
      current.rotation = test.rotation;
    } else if (!collides(testRight, board)) {
      current.x = testRight.x;
      current.rotation = test.rotation;
    }
  }
}

function getGhostPiece() {
  if (!cfg.ghost.enabled || !current) return null;
  const ghost = { ...current };
  while (true) {
    const test = { ...ghost, y: ghost.y + 1 };
    if (collides(test, board)) break;
    ghost.y++;
  }
  return ghost;
}

function drawBackground() {
  if (sprites.background && spriteLoaded.background) {
    ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = cfg.board.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = cfg.board.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  ctx.strokeStyle = cfg.board.gridColor;
  ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) {
    const xx = x * SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, canvas.height);
    ctx.stroke();
  }
  for (let y = 1; y < ROWS; y++) {
    const yy = y * SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(canvas.width, yy);
    ctx.stroke();
  }
}

function drawCell(x, y, type, alpha = 1) {
  if (!type) return;
  const color = cfg.pieces[type] || "#fff";
  const px = x * SIZE;
  const py = y * SIZE;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (sprites.cell && spriteLoaded.cell) {
    ctx.drawImage(sprites.cell, px, py, SIZE, SIZE);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, SIZE - 2, SIZE - 2);
    ctx.strokeStyle = "rgba(15,23,42,0.9)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 1, py + 1, SIZE - 2, SIZE - 2);
  }
  ctx.restore();
}

function render() {
  drawBackground();

  // Celdas fijas
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(c, r, board[r][c], 1);
      }
    }
  }

  // Ghost
  const ghost = getGhostPiece();
  if (ghost) {
    const blocks = getBlocks(ghost);
    for (const b of blocks) {
      if (b.y >= 0) drawCell(b.x, b.y, ghost.type, cfg.ghost.opacity);
    }
  }

  // Pieza actual
  if (current) {
    const blocks = getBlocks(current);
    for (const b of blocks) {
      if (b.y >= 0) drawCell(b.x, b.y, current.type, 1);
    }
  }

  scoreLabel.textContent = score;
  linesLabel.textContent = lines;
  levelLabel.textContent = level;
}

function gameLoop(timestamp) {
  if (gameState === "running") {
    if (!current) spawnPiece();
    if (!lastDropTime) lastDropTime = timestamp;
    const delta = timestamp - lastDropTime;
    if (delta >= dropInterval) {
      tickDown();
      lastDropTime = timestamp;
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  board = createEmptyBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 800;
  current = null;
  lastDropTime = 0;
}

function startGame() {
  if (gameState === "game-over") {
    resetGame();
  }
  gameState = "running";
  overlay.classList.add("hidden");
}

function gameOver() {
  gameState = "game-over";
  messageText.textContent = "Game over · pulsa jugar para reiniciar";
  playBtn.textContent = "Reiniciar";
  overlay.classList.remove("hidden");
}

playBtn.addEventListener("click", () => {
  if (gameState !== "running") {
    startGame();
  }
});

window.addEventListener("keydown", (e) => {
  if (gameState !== "running" && e.code === "Space") {
    startGame();
    return;
  }
  if (gameState !== "running") return;

  if (e.code === "ArrowLeft") {
    move(-1);
  } else if (e.code === "ArrowRight") {
    move(1);
  } else if (e.code === "ArrowUp") {
    rotate();
  } else if (e.code === "ArrowDown") {
    softDrop();
  } else if (e.code === "Space") {
    hardDrop();
  }
});

canvas.addEventListener("click", () => {
  if (gameState !== "running") {
    startGame();
  }
});

gameLoop();

