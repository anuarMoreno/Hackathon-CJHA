const cfg = window.BATTLE_CITY_ASSETS;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const livesLabel = document.getElementById("lives-label");
const enemiesLabel = document.getElementById("enemies-label");
const levelLabel = document.getElementById("level-label");

const T = cfg.tileSize;
const COLS = cfg.gridCols;
const ROWS = cfg.gridRows;

canvas.width = COLS * T;
canvas.height = ROWS * T;

// ── Directions ──────────────────────────────────────────────
const DIR = {
  UP:    { dx:  0, dy: -1 },
  DOWN:  { dx:  0, dy:  1 },
  LEFT:  { dx: -1, dy:  0 },
  RIGHT: { dx:  1, dy:  0 },
};
const DIR_LIST = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

// ── State ───────────────────────────────────────────────────
let gameState = "idle";
let grid = createEmptyGrid();

function createEmptyGrid() {
  const g = [];
  for (let r = 0; r < ROWS; r++) g.push(new Array(COLS).fill(0));
  return g;
}
let player = null;
let enemies = [];
let bullets = [];
let explosions = [];
let spawnQueue = [];
let score = 0;
let lives = 0;
let currentLevel = 0;
let enemiesRemaining = 0;
let lastSpawnTime = 0;
let eagleAlive = true;

const SPAWN_POINTS = [
  { x: 0,          y: 0 },
  { x: (COLS - 2), y: 0 },
  { x: Math.floor(COLS / 2) - 1, y: 0 },
];

const keys = {};

// ── Input ───────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") e.preventDefault();
  if (gameState !== "running" && (e.code === "Space" || e.code === "Enter")) {
    startGame();
  }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

playBtn.addEventListener("click", () => {
  if (gameState !== "running") startGame();
});

// ── Grid helpers ────────────────────────────────────────────
function loadMap(levelIndex) {
  const mapData = cfg.maps[levelIndex % cfg.maps.length];
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const ch = mapData[r] ? mapData[r][c] : "0";
      row.push(parseInt(ch) || 0);
    }
    grid.push(row);
  }
  placeEagle();
}

function placeEagle() {
  const cx = Math.floor(COLS / 2) - 1;
  const by = ROWS - 2;
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      grid[by + dy][cx + dx] = 9;
    }
  }
  // Protective brick around eagle
  for (let dx = -1; dx <= 2; dx++) {
    const gx = cx + dx;
    if (gx >= 0 && gx < COLS) {
      if (grid[by - 1]) grid[by - 1][gx] = 1;
    }
  }
  const leftX = cx - 1;
  const rightX = cx + 2;
  for (let dy = 0; dy < 2; dy++) {
    if (leftX >= 0) grid[by + dy][leftX] = 1;
    if (rightX < COLS) grid[by + dy][rightX] = 1;
  }
}

function tileAt(gx, gy) {
  if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return -1;
  return grid[gy][gx];
}

function isSolid(tile) {
  return tile === 1 || tile === 2 || tile === 9 || tile === -1;
}

function isWater(tile) {
  return tile === 3;
}

// ── Tank factory ────────────────────────────────────────────
function createTank(x, y, dir, type, isPlayer) {
  const stats = isPlayer ? cfg.player : cfg.enemies[type];
  return {
    x, y,
    dir,
    type: type || "player",
    isPlayer,
    speed: stats.speed,
    bulletSpeed: stats.bulletSpeed,
    fireRate: stats.fireRate,
    hp: isPlayer ? 1 : stats.hp,
    maxHp: isPlayer ? 1 : stats.hp,
    score: isPlayer ? 0 : stats.score,
    lastFire: 0,
    shield: isPlayer ? cfg.player.shieldDuration : 0,
    moveTimer: 0,
    aiDirTimer: 0,
    alive: true,
    spawnAnim: 20,
  };
}

// ── Collision ───────────────────────────────────────────────
function tankRect(tank) {
  return { x: tank.x, y: tank.y, w: 2 * T, h: 2 * T };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function tankCollidesGrid(tank) {
  const r = tankRect(tank);
  const startCol = Math.floor(r.x / T);
  const endCol   = Math.floor((r.x + r.w - 1) / T);
  const startRow = Math.floor(r.y / T);
  const endRow   = Math.floor((r.y + r.h - 1) / T);
  for (let gy = startRow; gy <= endRow; gy++) {
    for (let gx = startCol; gx <= endCol; gx++) {
      const tile = tileAt(gx, gy);
      if (isSolid(tile) || isWater(tile)) return true;
    }
  }
  return false;
}

function tankCollidesOther(tank, allTanks) {
  const r = tankRect(tank);
  for (const other of allTanks) {
    if (other === tank || !other.alive) continue;
    if (rectsOverlap(r, tankRect(other))) return true;
  }
  return false;
}

function tankInBounds(tank) {
  const px = canvas.width - 2 * T;
  const py = canvas.height - 2 * T;
  return tank.x >= 0 && tank.x <= px && tank.y >= 0 && tank.y <= py;
}

// ── Movement ────────────────────────────────────────────────
function snapToGrid(val) {
  return Math.round(val / (T / 2)) * (T / 2);
}

function moveTank(tank, dir, dt) {
  const oldX = tank.x;
  const oldY = tank.y;

  tank.dir = dir;

  if (dir.dx !== 0) {
    tank.y = snapToGrid(tank.y);
  } else {
    tank.x = snapToGrid(tank.x);
  }

  const step = tank.speed * (dt / 16);
  tank.x += dir.dx * step;
  tank.y += dir.dy * step;

  const allTanks = [player, ...enemies].filter(t => t && t.alive);

  if (!tankInBounds(tank) || tankCollidesGrid(tank) || tankCollidesOther(tank, allTanks)) {
    tank.x = oldX;
    tank.y = oldY;
    return false;
  }
  return true;
}

// ── Bullets ─────────────────────────────────────────────────
function fireBullet(tank, now) {
  if (now - tank.lastFire < tank.fireRate) return;
  const activeBullets = bullets.filter(b => b.owner === tank).length;
  const maxBullets = tank.isPlayer ? 2 : 1;
  if (activeBullets >= maxBullets) return;

  tank.lastFire = now;

  const cx = tank.x + T;
  const cy = tank.y + T;
  const bSize = 4;

  bullets.push({
    x: cx - bSize / 2 + tank.dir.dx * T,
    y: cy - bSize / 2 + tank.dir.dy * T,
    dir: { ...tank.dir },
    speed: tank.bulletSpeed,
    owner: tank,
    isPlayerBullet: tank.isPlayer,
    size: bSize,
    alive: true,
    power: tank.isPlayer ? 1 : 1,
  });
}

function updateBullets(dt) {
  for (const b of bullets) {
    if (!b.alive) continue;
    const step = b.speed * (dt / 16);
    b.x += b.dir.dx * step;
    b.y += b.dir.dy * step;

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      b.alive = false;
      spawnExplosion(b.x, b.y, 8);
      continue;
    }

    const gx = Math.floor(b.x / T);
    const gy = Math.floor(b.y / T);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = gx + dx;
        const ty = gy + dy;
        const tile = tileAt(tx, ty);
        if (tile === -1) continue;

        const tileRect = { x: tx * T, y: ty * T, w: T, h: T };
        const bRect = { x: b.x, y: b.y, w: b.size, h: b.size };

        if (!rectsOverlap(bRect, tileRect)) continue;

        if (tile === 1) {
          grid[ty][tx] = 0;
          b.alive = false;
          spawnExplosion(b.x, b.y, 10);
        } else if (tile === 2) {
          b.alive = false;
          spawnExplosion(b.x, b.y, 6);
        } else if (tile === 9) {
          grid[ty][tx] = 0;
          b.alive = false;
          eagleAlive = false;
          spawnExplosion(tx * T + T / 2, ty * T + T / 2, 30);
        }
      }
    }

    if (!b.alive) continue;

    const bRect = { x: b.x, y: b.y, w: b.size, h: b.size };

    if (b.isPlayerBullet) {
      for (const e of enemies) {
        if (!e.alive) continue;
        if (rectsOverlap(bRect, tankRect(e))) {
          b.alive = false;
          e.hp--;
          if (e.hp <= 0) {
            e.alive = false;
            score += e.score;
            enemiesRemaining--;
            spawnExplosion(e.x + T, e.y + T, 24);
          } else {
            spawnExplosion(b.x, b.y, 8);
          }
          break;
        }
      }
    } else {
      if (player && player.alive && rectsOverlap(bRect, tankRect(player))) {
        b.alive = false;
        if (player.shield <= 0) {
          player.alive = false;
          lives--;
          spawnExplosion(player.x + T, player.y + T, 24);
        } else {
          spawnExplosion(b.x, b.y, 8);
        }
      }
    }

    // Bullet vs bullet
    for (const other of bullets) {
      if (other === b || !other.alive || !b.alive) continue;
      if (other.isPlayerBullet === b.isPlayerBullet) continue;
      const oRect = { x: other.x, y: other.y, w: other.size, h: other.size };
      if (rectsOverlap(bRect, oRect)) {
        b.alive = false;
        other.alive = false;
        spawnExplosion(b.x, b.y, 6);
      }
    }
  }

  bullets = bullets.filter(b => b.alive);
}

// ── Explosions ──────────────────────────────────────────────
function spawnExplosion(x, y, radius) {
  explosions.push({ x, y, radius, maxRadius: radius, life: 1.0 });
}

function updateExplosions(dt) {
  for (const e of explosions) {
    e.life -= dt * 0.004;
  }
  explosions = explosions.filter(e => e.life > 0);
}

// ── AI ──────────────────────────────────────────────────────
function updateEnemyAI(enemy, dt, now) {
  if (!enemy.alive || enemy.spawnAnim > 0) return;

  enemy.aiDirTimer -= dt;

  if (enemy.aiDirTimer <= 0) {
    enemy.aiDirTimer = 800 + Math.random() * 1500;

    if (player && player.alive && Math.random() < 0.4) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        enemy.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      } else {
        enemy.dir = dy > 0 ? DIR.DOWN : DIR.UP;
      }
    } else {
      enemy.dir = DIR_LIST[Math.floor(Math.random() * 4)];
    }
  }

  const moved = moveTank(enemy, enemy.dir, dt);
  if (!moved) {
    enemy.aiDirTimer = 0;
  }

  if (Math.random() < 0.02) {
    fireBullet(enemy, now);
  }
}

// ── Spawning enemies ────────────────────────────────────────
function buildSpawnQueue(levelIndex) {
  const wave = cfg.waves[levelIndex % cfg.waves.length];
  const queue = [];
  for (const [type, count] of Object.entries(wave)) {
    for (let i = 0; i < count; i++) queue.push(type);
  }
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

function spawnNextEnemy(now) {
  if (spawnQueue.length === 0) return;
  if (enemies.filter(e => e.alive).length >= 4) return;
  if (now - lastSpawnTime < 2000) return;

  const type = spawnQueue.shift();
  const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];

  const enemy = createTank(sp.x * T, sp.y * T, DIR.DOWN, type, false);

  const allTanks = [player, ...enemies].filter(t => t && t.alive);
  if (tankCollidesOther(enemy, allTanks)) {
    spawnQueue.unshift(type);
    return;
  }

  enemies.push(enemy);
  lastSpawnTime = now;
}

// ── Player respawn ──────────────────────────────────────────
function respawnPlayer() {
  const spX = 4 * T;
  const spY = (ROWS - 2) * T;

  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const gx = 4 + dx;
      const gy = ROWS - 2 + dy;
      if (gy < ROWS && gx < COLS && grid[gy][gx] !== 9) {
        grid[gy][gx] = 0;
      }
    }
  }

  player = createTank(spX, spY, DIR.UP, "player", true);
}

// ── Drawing ─────────────────────────────────────────────────
function drawTile(gx, gy, tile) {
  const x = gx * T;
  const y = gy * T;

  if (tile === 1) {
    ctx.fillStyle = cfg.colors.brick;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = cfg.colors.brickHighlight;
    ctx.fillRect(x + 1, y + 1, T / 2 - 1, T / 2 - 2);
    ctx.fillRect(x + T / 2 + 1, y + T / 2, T / 2 - 2, T / 2 - 1);
  } else if (tile === 2) {
    ctx.fillStyle = cfg.colors.steel;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = cfg.colors.steelHighlight;
    ctx.fillRect(x + 2, y + 2, T - 4, 2);
    ctx.fillRect(x + 2, y + 2, 2, T - 4);
  } else if (tile === 3) {
    ctx.fillStyle = cfg.colors.water;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = cfg.colors.waterHighlight;
    const wave = (Date.now() / 400) % 2;
    for (let i = 0; i < 3; i++) {
      const wy = y + 4 + i * 7 + (wave > 1 ? 2 : 0);
      ctx.fillRect(x + 2, wy, T - 4, 2);
    }
  } else if (tile === 4) {
    ctx.fillStyle = cfg.colors.trees;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = cfg.colors.treesHighlight;
    for (let i = 0; i < 4; i++) {
      const lx = x + Math.random() * (T - 4);
      const ly = y + Math.random() * (T - 4);
      ctx.fillRect(lx, ly, 4, 4);
    }
  } else if (tile === 5) {
    ctx.fillStyle = cfg.colors.ice;
    ctx.fillRect(x, y, T, T);
  } else if (tile === 9) {
    ctx.fillStyle = eagleAlive ? cfg.colors.eagle : cfg.colors.eagleDead;
    ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
    if (eagleAlive) {
      ctx.fillStyle = "#B8860B";
      ctx.fillRect(x + T / 2 - 3, y + 4, 6, T - 8);
      ctx.fillRect(x + 4, y + T / 2 - 3, T - 8, 6);
    }
  }
}

function drawTank(tank) {
  if (!tank.alive) return;

  if (tank.spawnAnim > 0) {
    ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tank.spawnAnim * 0.5));
    tank.spawnAnim--;
  }

  const x = tank.x;
  const y = tank.y;
  const s = 2 * T;
  let bodyColor, detailColor;

  if (tank.isPlayer) {
    bodyColor = cfg.colors.playerTank;
    detailColor = cfg.colors.playerTankDetail;
  } else {
    const typeColors = {
      basic: [cfg.colors.enemyBasic, cfg.colors.enemyBasicDetail],
      fast:  [cfg.colors.enemyFast, cfg.colors.enemyFastDetail],
      power: [cfg.colors.enemyPower, cfg.colors.enemyPowerDetail],
      armor: [cfg.colors.enemyArmor, cfg.colors.enemyArmorDetail],
    };
    const c = typeColors[tank.type] || typeColors.basic;
    bodyColor = c[0];
    detailColor = c[1];

    if (tank.type === "armor" && tank.hp > 1) {
      const flash = Math.sin(Date.now() / 200) > 0;
      if (flash) bodyColor = "#FFFFFF";
    }
  }

  ctx.fillStyle = detailColor;
  if (tank.dir === DIR.UP || tank.dir === DIR.DOWN) {
    ctx.fillRect(x + 2, y + 4, 8, s - 8);
    ctx.fillRect(x + s - 10, y + 4, 8, s - 8);
  } else {
    ctx.fillRect(x + 4, y + 2, s - 8, 8);
    ctx.fillRect(x + 4, y + s - 10, s - 8, 8);
  }

  // Tracks
  ctx.fillStyle = "#333";
  if (tank.dir === DIR.UP || tank.dir === DIR.DOWN) {
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 1, y + 4 + i * 8, 10, 3);
      ctx.fillRect(x + s - 11, y + 4 + i * 8, 10, 3);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 4 + i * 8, y + 1, 3, 10);
      ctx.fillRect(x + 4 + i * 8, y + s - 11, 3, 10);
    }
  }

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 10, y + 10, s - 20, s - 20);

  // Barrel
  ctx.fillStyle = cfg.colors.playerBarrel;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const bw = 4;
  const bl = s / 2 - 2;

  if (tank.dir === DIR.UP) {
    ctx.fillRect(cx - bw / 2, cy - bl, bw, bl);
  } else if (tank.dir === DIR.DOWN) {
    ctx.fillRect(cx - bw / 2, cy, bw, bl);
  } else if (tank.dir === DIR.LEFT) {
    ctx.fillRect(cx - bl, cy - bw / 2, bl, bw);
  } else if (tank.dir === DIR.RIGHT) {
    ctx.fillRect(cx, cy - bw / 2, bl, bw);
  }

  // Turret circle
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  // Shield
  if (tank.shield > 0) {
    ctx.strokeStyle = cfg.colors.shield;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.globalAlpha = 1;
}

function drawBullet(b) {
  ctx.fillStyle = cfg.colors.bullet;
  ctx.fillRect(b.x, b.y, b.size, b.size);
}

function drawExplosion(e) {
  const colors = cfg.colors.explosion;
  const r = e.maxRadius * (1 - e.life * 0.3);
  for (let i = colors.length - 1; i >= 0; i--) {
    ctx.globalAlpha = e.life * (1 - i / colors.length);
    ctx.fillStyle = colors[i];
    const cr = r * (1 - i * 0.18);
    ctx.beginPath();
    ctx.arc(e.x, e.y, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Main render & update ────────────────────────────────────
function render() {
  ctx.fillStyle = cfg.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tiles (below trees)
  for (let gy = 0; gy < ROWS; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      const tile = grid[gy][gx];
      if (tile && tile !== 4) drawTile(gx, gy, tile);
    }
  }

  // Tanks
  if (player && player.alive) drawTank(player);
  for (const e of enemies) drawTank(e);

  // Trees (rendered on top)
  for (let gy = 0; gy < ROWS; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      if (grid[gy][gx] === 4) drawTile(gx, gy, 4);
    }
  }

  // Bullets
  for (const b of bullets) drawBullet(b);

  // Explosions
  for (const e of explosions) drawExplosion(e);

  // HUD
  scoreLabel.textContent = score;
  livesLabel.textContent = lives;
  enemiesLabel.textContent = enemiesRemaining;
  levelLabel.textContent = currentLevel + 1;
}

let lastTime = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const rawDt = timestamp - lastTime;
  lastTime = timestamp;
  const dt = Math.min(rawDt, 32);

  if (gameState === "running") {
    const now = performance.now();

    // Player input
    if (player && player.alive) {
      player.shield = Math.max(0, player.shield - dt);

      let moved = false;
      if (keys["ArrowUp"]    || keys["KeyW"]) { moved = moveTank(player, DIR.UP,    dt); }
      else if (keys["ArrowDown"]  || keys["KeyS"]) { moved = moveTank(player, DIR.DOWN,  dt); }
      else if (keys["ArrowLeft"]  || keys["KeyA"]) { moved = moveTank(player, DIR.LEFT,  dt); }
      else if (keys["ArrowRight"] || keys["KeyD"]) { moved = moveTank(player, DIR.RIGHT, dt); }

      if (keys["Space"]) fireBullet(player, now);
    } else if (player && !player.alive) {
      if (lives > 0) {
        respawnPlayer();
      } else {
        doGameOver("Has perdido todas las vidas");
      }
    }

    // Enemy AI
    for (const e of enemies) {
      if (e.alive) {
        e.shield = Math.max(0, e.shield - dt);
        updateEnemyAI(e, dt, now);
      }
    }
    enemies = enemies.filter(e => e.alive || e.spawnAnim > 0);

    spawnNextEnemy(now);

    updateBullets(dt);
    updateExplosions(dt);

    if (!eagleAlive) {
      doGameOver("Tu base ha sido destruida");
    }

    if (enemiesRemaining <= 0 && spawnQueue.length === 0 && enemies.filter(e => e.alive).length === 0) {
      nextLevel();
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ── Game flow ───────────────────────────────────────────────
function startGame() {
  score = 0;
  lives = cfg.player.lives;
  currentLevel = 0;
  gameState = "running";
  overlay.classList.add("hidden");
  initLevel(currentLevel);
}

function initLevel(levelIndex) {
  loadMap(levelIndex);
  eagleAlive = true;
  enemies = [];
  bullets = [];
  explosions = [];
  spawnQueue = buildSpawnQueue(levelIndex);
  enemiesRemaining = spawnQueue.length;
  lastSpawnTime = 0;
  respawnPlayer();
}

function nextLevel() {
  currentLevel++;
  initLevel(currentLevel);
}

function doGameOver(reason) {
  gameState = "game-over";
  messageText.textContent = `Game Over - ${reason}\nPuntuaci\u00f3n: ${score}`;
  playBtn.textContent = "Reiniciar";
  overlay.classList.remove("hidden");
}

requestAnimationFrame(gameLoop);
