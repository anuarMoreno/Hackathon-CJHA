const cfg = window.SPACE_ASSETS;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("ui-overlay");
const messageText = document.getElementById("message-text");
const playBtn = document.getElementById("play-btn");
const scoreLabel = document.getElementById("score-label");
const bestLabel = document.getElementById("best-label");
const livesLabel = document.getElementById("lives-label");
const waveLabel = document.getElementById("wave-label");
const bossBar = document.getElementById("boss-bar");
const bossBarFill = document.getElementById("boss-bar-fill");

let gameState = "idle";
let score = 0;
let bestScore = Number(localStorage.getItem("space_impact_best") || 0);
bestLabel.textContent = bestScore;

let lives = 3;
let wave = 0;
let waveEnemiesLeft = 0;
let wavePauseTimer = 0;
let bossActive = false;

const keys = {};
let lastTime = 0;

const stars = [];
for (let i = 0; i < cfg.background.starsCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 1 + Math.random() * 1.5,
    speed: 0.3 + Math.random() * 1.2,
  });
}

const ship = {
  x: 60,
  y: canvas.height / 2,
  width: cfg.ship.width,
  height: cfg.ship.height,
  fireCooldown: 0,
  shieldTimer: 0,
  rapidFireTimer: 0,
  triShotTimer: 0,
  invincibleTimer: 0,
  flameFrame: 0,
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const explosions = [];
const powerUps = [];

function resetGame() {
  score = 0;
  lives = 3;
  wave = 0;
  waveEnemiesLeft = 0;
  wavePauseTimer = 0;
  bossActive = false;
  bossBar.classList.add("hidden");

  ship.x = 60;
  ship.y = canvas.height / 2;
  ship.fireCooldown = 0;
  ship.shieldTimer = 0;
  ship.rapidFireTimer = 0;
  ship.triShotTimer = 0;
  ship.invincibleTimer = 0;

  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  explosions.length = 0;
  powerUps.length = 0;

  livesLabel.textContent = lives;
  waveLabel.textContent = wave;
  scoreLabel.textContent = 0;
}

function startWave() {
  wave++;
  waveLabel.textContent = wave;

  if (wave % cfg.waves.bossEveryNWaves === 0) {
    bossActive = true;
    waveEnemiesLeft = 1;
  } else {
    bossActive = false;
    waveEnemiesLeft = cfg.waves.enemiesPerWave + Math.floor(wave * 0.5);
  }
}

function spawnEnemy() {
  if (waveEnemiesLeft <= 0) return;
  waveEnemiesLeft--;

  let type;
  if (bossActive) {
    type = "boss";
  } else {
    const r = Math.random();
    if (wave >= 3 && r < 0.15) type = "tank";
    else if (wave >= 2 && r < 0.35) type = "fast";
    else type = "basic";
  }

  const def = cfg.enemies[type];
  const margin = 30;
  const y = margin + Math.random() * (canvas.height - def.height - margin * 2);

  enemies.push({
    x: canvas.width + 10,
    y,
    width: def.width,
    height: def.height,
    type,
    hp: def.hp + (type !== "boss" ? Math.floor(wave / 6) : 0),
    maxHp: def.hp + (type !== "boss" ? Math.floor(wave / 6) : 0),
    fireCooldown: type === "boss" ? def.fireRate : 0,
    sinOffset: Math.random() * Math.PI * 2,
    sinAmplitude: type === "fast" ? 1.5 : type === "boss" ? 0.8 : 0,
    entered: false,
  });
}

let spawnTimer = 0;

function spawnBullet(x, y, dy) {
  bullets.push({
    x,
    y,
    width: cfg.bullet.width,
    height: cfg.bullet.height,
    dy: dy || 0,
  });
}

function spawnEnemyBullet(x, y, dx, dy) {
  enemyBullets.push({
    x,
    y,
    width: cfg.enemyBullet.width,
    height: cfg.enemyBullet.height,
    dx: dx || -cfg.enemyBullet.speed,
    dy: dy || 0,
  });
}

function spawnExplosion(cx, cy, scale) {
  const particles = [];
  const count = cfg.explosion.particleCount;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed * (scale || 1),
      vy: Math.sin(angle) * speed * (scale || 1),
      size: 2 + Math.random() * 3,
      color: cfg.explosion.colors[i % cfg.explosion.colors.length],
      life: 1,
    });
  }
  explosions.push({ particles, timer: cfg.explosion.duration });
}

function spawnPowerUp(x, y) {
  if (Math.random() > 0.25) return;
  const types = Object.keys(cfg.powerUp.types);
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x,
    y,
    size: cfg.powerUp.size,
    type,
    pulse: 0,
  });
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function update(dt) {
  const delta = Math.min(dt / 16.67, 2.5);

  ship.flameFrame += delta;
  if (ship.shieldTimer > 0) ship.shieldTimer -= dt;
  if (ship.rapidFireTimer > 0) ship.rapidFireTimer -= dt;
  if (ship.triShotTimer > 0) ship.triShotTimer -= dt;
  if (ship.invincibleTimer > 0) ship.invincibleTimer -= dt;

  const spd = cfg.ship.speed * delta;
  if (keys["ArrowUp"] || keys["KeyW"]) ship.y -= spd;
  if (keys["ArrowDown"] || keys["KeyS"]) ship.y += spd;
  if (keys["ArrowLeft"] || keys["KeyA"]) ship.x -= spd;
  if (keys["ArrowRight"] || keys["KeyD"]) ship.x += spd;

  ship.x = Math.max(0, Math.min(canvas.width * 0.45, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

  ship.fireCooldown -= dt;
  if (keys["Space"] && ship.fireCooldown <= 0) {
    const rate =
      ship.rapidFireTimer > 0 ? cfg.ship.fireRate * 0.4 : cfg.ship.fireRate;
    ship.fireCooldown = rate;
    const bx = ship.x + ship.width;
    const by = ship.y + ship.height / 2 - cfg.bullet.height / 2;
    spawnBullet(bx, by, 0);
    if (ship.triShotTimer > 0) {
      spawnBullet(bx, by, -1.5);
      spawnBullet(bx, by, 1.5);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += cfg.bullet.speed * delta;
    b.y += (b.dy || 0) * delta;
    if (b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.dx * delta;
    b.y += b.dy * delta;
    if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
      enemyBullets.splice(i, 1);
    }
  }

  for (const s of stars) {
    s.x -= s.speed * delta;
    if (s.x < -2) {
      s.x = canvas.width + 2;
      s.y = Math.random() * canvas.height;
    }
  }

  if (waveEnemiesLeft <= 0 && enemies.length === 0) {
    wavePauseTimer -= dt;
    if (wavePauseTimer <= 0) {
      startWave();
      wavePauseTimer = cfg.waves.wavePause;
      spawnTimer = 0;
    }
  }

  if (waveEnemiesLeft > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = bossActive ? 100 : 600 - Math.min(wave * 20, 300);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const def = cfg.enemies[e.type];
    let targetX;

    if (e.type === "boss") {
      targetX = canvas.width - def.width - 40;
      if (e.x > targetX) {
        e.x -= def.speed * delta * 2;
        if (e.x <= targetX) e.entered = true;
      } else {
        e.entered = true;
        e.sinOffset += 0.02 * delta;
        e.y += Math.sin(e.sinOffset) * e.sinAmplitude * delta;
      }

      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0 && e.entered) {
        e.fireCooldown = def.fireRate;
        const cx = e.x;
        const cy = e.y + e.height / 2;
        spawnEnemyBullet(cx, cy, -cfg.enemyBullet.speed, 0);
        spawnEnemyBullet(cx, cy, -cfg.enemyBullet.speed, -1.5);
        spawnEnemyBullet(cx, cy, -cfg.enemyBullet.speed, 1.5);
      }

      bossBar.classList.remove("hidden");
      bossBarFill.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + "%";
    } else {
      e.x -= def.speed * delta;
      if (e.sinAmplitude) {
        e.sinOffset += 0.04 * delta;
        e.y += Math.sin(e.sinOffset) * e.sinAmplitude * delta;
      }
    }

    if (e.x + e.width < -10) {
      enemies.splice(i, 1);
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (rectsOverlap(bullets[j], e)) {
        bullets.splice(j, 1);
        e.hp--;
        if (e.hp <= 0) {
          score += def.score;
          scoreLabel.textContent = Math.floor(score);
          spawnExplosion(
            e.x + e.width / 2,
            e.y + e.height / 2,
            e.type === "boss" ? 2.5 : 1
          );
          if (e.type === "boss") {
            bossBar.classList.add("hidden");
            bossActive = false;
            spawnExplosion(e.x + e.width * 0.3, e.y + e.height * 0.3, 2);
            spawnExplosion(e.x + e.width * 0.7, e.y + e.height * 0.7, 2);
          }
          spawnPowerUp(e.x + e.width / 2, e.y + e.height / 2);
          enemies.splice(i, 1);
          break;
        } else {
          spawnExplosion(bullets.length > 0 ? e.x : e.x + e.width / 2, e.y + e.height / 2, 0.4);
        }
      }
    }
  }

  const shipRect = {
    x: ship.x + 4,
    y: ship.y + 3,
    width: ship.width - 8,
    height: ship.height - 6,
  };

  if (ship.invincibleTimer <= 0) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (rectsOverlap(shipRect, enemies[i])) {
        hitShip();
        break;
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (rectsOverlap(shipRect, enemyBullets[i])) {
        enemyBullets.splice(i, 1);
        hitShip();
        break;
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    p.x -= cfg.powerUp.speed * delta;
    p.pulse += 0.08 * delta;
    if (p.x < -20) {
      powerUps.splice(i, 1);
      continue;
    }
    const pRect = { x: p.x, y: p.y, width: p.size, height: p.size };
    if (rectsOverlap(shipRect, pRect)) {
      applyPowerUp(p.type);
      powerUps.splice(i, 1);
    }
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.timer -= dt;
    for (const p of ex.particles) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= (dt / cfg.explosion.duration) * 1.2;
      p.vx *= 0.97;
      p.vy *= 0.97;
    }
    if (ex.timer <= 0) explosions.splice(i, 1);
  }

  if (Math.floor(score) > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("space_impact_best", String(bestScore));
    bestLabel.textContent = bestScore;
  }
}

function hitShip() {
  if (ship.shieldTimer > 0) {
    ship.shieldTimer = 0;
    spawnExplosion(ship.x + ship.width / 2, ship.y + ship.height / 2, 0.6);
    ship.invincibleTimer = 500;
    return;
  }

  lives--;
  livesLabel.textContent = lives;
  spawnExplosion(ship.x + ship.width / 2, ship.y + ship.height / 2, 1);
  ship.invincibleTimer = 1500;

  if (lives <= 0) {
    gameOver();
  }
}

function applyPowerUp(type) {
  if (type === "trishot") ship.triShotTimer = 8000;
  else if (type === "shield") ship.shieldTimer = 10000;
  else if (type === "rapidfire") ship.rapidFireTimer = 6000;
}

function drawBackground() {
  ctx.fillStyle = cfg.background.skyColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = cfg.background.nebulaColor;
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.7, canvas.height * 0.3, 200, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cfg.background.starColor;
  for (const s of stars) {
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  const flicker = Math.sin(ship.flameFrame * 0.6) > 0;
  ctx.fillStyle = flicker ? cfg.ship.flameColor : cfg.ship.flameColorAlt;
  ctx.beginPath();
  ctx.moveTo(-2, ship.height * 0.3);
  ctx.lineTo(-10 - Math.random() * 6, ship.height * 0.5);
  ctx.lineTo(-2, ship.height * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cfg.ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.width, ship.height * 0.5);
  ctx.lineTo(ship.width * 0.6, 0);
  ctx.lineTo(0, ship.height * 0.25);
  ctx.lineTo(0, ship.height * 0.75);
  ctx.lineTo(ship.width * 0.6, ship.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cfg.ship.cockpitColor;
  ctx.beginPath();
  ctx.ellipse(ship.width * 0.55, ship.height * 0.5, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cfg.ship.color;
  ctx.fillRect(ship.width * 0.1, -3, ship.width * 0.3, 4);
  ctx.fillRect(ship.width * 0.1, ship.height - 1, ship.width * 0.3, 4);

  if (ship.shieldTimer > 0) {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ship.width * 0.45, ship.height * 0.5, ship.width * 0.7, ship.height * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (ship.invincibleTimer > 0 && Math.floor(ship.invincibleTimer / 80) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBullets() {
  ctx.fillStyle = cfg.bullet.color;
  ctx.shadowColor = cfg.bullet.color;
  ctx.shadowBlur = 6;
  for (const b of bullets) {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = cfg.enemyBullet.color;
  ctx.shadowColor = cfg.enemyBullet.color;
  ctx.shadowBlur = 4;
  for (const b of enemyBullets) {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }
  ctx.shadowBlur = 0;
}

function drawEnemies() {
  for (const e of enemies) {
    const def = cfg.enemies[e.type];
    ctx.save();
    ctx.translate(e.x, e.y);

    if (e.type === "boss") {
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 0, e.width, e.height);

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(4, 4, e.width - 8, 4);
      ctx.fillRect(4, e.height - 8, e.width - 8, 4);

      ctx.fillStyle = def.coreColor;
      ctx.beginPath();
      ctx.arc(e.width * 0.4, e.height * 0.5, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.moveTo(0, e.height * 0.2);
      ctx.lineTo(-12, e.height * 0.1);
      ctx.lineTo(-8, e.height * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, e.height * 0.8);
      ctx.lineTo(-12, e.height * 0.9);
      ctx.lineTo(-8, e.height * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "tank") {
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 2, e.width, e.height - 4);

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(2, e.height * 0.35, e.width * 0.4, e.height * 0.3);

      ctx.fillStyle = def.color;
      ctx.fillRect(-6, e.height * 0.4, 8, e.height * 0.2);
    } else if (e.type === "fast") {
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.moveTo(0, e.height * 0.5);
      ctx.lineTo(e.width * 0.6, 0);
      ctx.lineTo(e.width, e.height * 0.3);
      ctx.lineTo(e.width, e.height * 0.7);
      ctx.lineTo(e.width * 0.6, e.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(e.width * 0.5, e.height * 0.4, 4, e.height * 0.2);
    } else {
      ctx.fillStyle = def.color;
      ctx.fillRect(2, 2, e.width - 4, e.height - 4);

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(4, e.height * 0.3, 3, e.height * 0.4);
      ctx.fillRect(e.width - 7, e.height * 0.3, 3, e.height * 0.4);
    }

    if (e.hp < e.maxHp && e.type !== "boss") {
      const barW = e.width;
      const barH = 3;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(0, -6, barW, barH);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(0, -6, barW * (e.hp / e.maxHp), barH);
    }

    ctx.restore();
  }
}

function drawExplosions() {
  for (const ex of explosions) {
    for (const p of ex.particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

function drawPowerUps() {
  for (const p of powerUps) {
    const def = cfg.powerUp.types[p.type];
    const pulse = 1 + Math.sin(p.pulse) * 0.15;
    const sz = p.size * pulse;

    ctx.save();
    ctx.translate(p.x + p.size / 2, p.y + p.size / 2);

    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sz / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = def.color;
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.label, 0, 0);

    ctx.restore();
  }
}

function drawHUD() {
  if (ship.triShotTimer > 0) {
    ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
    ctx.font = "10px system-ui";
    ctx.fillText("TRIPLE", ship.x, ship.y - 8);
  }
  if (ship.rapidFireTimer > 0) {
    ctx.fillStyle = "rgba(234, 179, 8, 0.7)";
    ctx.font = "10px system-ui";
    ctx.fillText("RAPID", ship.x + (ship.triShotTimer > 0 ? 42 : 0), ship.y - 8);
  }
}

function render() {
  drawBackground();
  drawPowerUps();
  drawBullets();
  drawEnemies();
  drawExplosions();

  if (gameState === "running" || gameState === "idle") {
    drawShip();
  }

  drawHUD();
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

function startGame() {
  resetGame();
  gameState = "running";
  overlay.classList.add("hidden");
  wavePauseTimer = 500;
}

function gameOver() {
  if (gameState !== "running") return;
  gameState = "dead";
  bossBar.classList.add("hidden");
  messageText.textContent = `Fin del juego · Oleada ${wave} · ${Math.floor(score)} pts`;
  playBtn.textContent = "Reintentar";
  overlay.classList.remove("hidden");
}

playBtn.addEventListener("click", () => {
  if (gameState === "running") return;
  startGame();
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code
    )
  ) {
    e.preventDefault();
  }
  if (e.code === "Space" || e.code === "Enter") {
    if (gameState === "idle" || gameState === "dead") {
      startGame();
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

requestAnimationFrame(gameLoop);
