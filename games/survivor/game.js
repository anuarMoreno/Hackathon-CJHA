// --- Configuración y Estado del Juego ---
const cfg = window.SURVIVOR_ASSETS;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let GAME_WIDTH = window.innerWidth > 1200 ? 1200 : window.innerWidth;
let GAME_HEIGHT = window.innerHeight > 800 ? 800 : window.innerHeight;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Constantes
const FPS = 60;
const MAP_SIZE = 3000; // El mundo es más grande que la pantalla

// Variables de Estado
let gameState = 'START'; // START, PLAYING, LEVELUP, GAMEOVER
let lastTime = 0;
let gameTime = 0; // en segundos
let frameCount = 0;

// Elementos UI
const startScreen = document.getElementById('start-screen');
const levelupScreen = document.getElementById('levelup-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const timeDisplay = document.getElementById('time-display');
const levelDisplay = document.getElementById('level-display');
const killsDisplay = document.getElementById('kills-display');
const xpBar = document.getElementById('xp-bar-fill');
const hpBar = document.getElementById('hp-bar-fill');
const upgradesContainer = document.getElementById('upgrades-container');

// Entidades
let player;
let enemies = [];
let projectiles = [];
let gems = [];
let damageTexts = [];
let kills = 0;

// Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

document.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    
    // Space to start/restart
    if (e.code === 'Space') {
        if (gameState === 'START') startGame();
        else if (gameState === 'GAMEOVER') resetGame();
    }
});
document.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Resize handler
window.addEventListener('resize', () => {
    const container = document.getElementById('game-container');
    GAME_WIDTH = container.clientWidth;
    GAME_HEIGHT = container.clientHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
});

// --- Clases ---

class Player {
    constructor() {
        this.x = MAP_SIZE / 2;
        this.y = MAP_SIZE / 2;
        this.radius = 15;
        this.speed = 200; // pixeles por segundo
        this.color = cfg.colors.player;
        
        // Stats
        this.maxHp = 100;
        this.hp = 100;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 10;
        
        // Armas / Builds
        this.damageMtp = 1.0;
        this.projSpeed = 400;
        this.fireRate = 1.0; // Disparos por segundo
        this.projPiercing = 1; // Cuantos enemigos atraviesa
        this.projSize = 5;
        this.auraEnabled = false;
        this.auraRadius = 80;
        this.auraDamage = 5;
        
        this.fireTimer = 0;
        this.auraTimer = 0;
    }

    update(dt) {
        // Movimiento
        let dx = 0;
        let dy = 0;
        if (keys.w || keys.ArrowUp) dy -= 1;
        if (keys.s || keys.ArrowDown) dy += 1;
        if (keys.a || keys.ArrowLeft) dx -= 1;
        if (keys.d || keys.ArrowRight) dx += 1;

        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        // Limites del mapa
        this.x = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.y));

        // Disparo automático
        this.fireTimer += dt;
        if (this.fireTimer >= (1 / this.fireRate)) {
            this.fire();
            this.fireTimer = 0;
        }

        // Aura de daño
        if (this.auraEnabled) {
            this.auraTimer += dt;
            if (this.auraTimer >= 0.5) { // Daño de aura 2 veces por segundo
                this.pulseAura();
                this.auraTimer = 0;
            }
        }
    }

    fire() {
        if (enemies.length === 0) return;
        
        // Encontrar enemigo más cercano
        let closestDist = Infinity;
        let target = null;
        
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < closestDist) {
                closestDist = dist;
                target = enemy;
            }
        }

        if (target && closestDist < 600) { // Solo disparar si está razonablemente cerca
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            projectiles.push(new Projectile(this.x, this.y, angle, 20 * this.damageMtp, this.projSpeed, this.projPiercing, this.projSize));
        }
    }

    pulseAura() {
        // Dañar enemigos en el aura
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < this.auraRadius + enemy.radius) {
                enemy.takeDamage(this.auraDamage * this.damageMtp);
            }
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
        this.updateUI();
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
        this.hp = Math.min(this.maxHp, this.hp + 20); // Heal a bit
        
        gameState = 'LEVELUP';
        showLevelUpScreen();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateUI();
        if (this.hp <= 0) {
            gameOver();
        }
    }

    updateUI() {
        levelDisplay.textContent = this.level;
        killsDisplay.textContent = kills;
        
        const xpPercent = (this.xp / this.xpToNext) * 100;
        xpBar.style.width = `${xpPercent}%`;
        
        const hpPercent = Math.max(0, (this.hp / this.maxHp) * 100);
        hpBar.style.width = `${hpPercent}%`;
    }

    draw(ctx, cameraX, cameraY) {
        // Aura
        if (this.auraEnabled) {
            ctx.beginPath();
            ctx.arc(this.x - cameraX, this.y - cameraY, this.auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = cfg.colors.playerAura;
            ctx.fill();
            ctx.strokeStyle = cfg.colors.playerAuraBorder;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Jugador
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pequeño visor indicando dirección de movimiento (opcional)
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 0: basico, 1: rapido, 2: tanque
        
        if (type === 0) {
            this.radius = 12;
            this.hp = 20 + (gameTime / 10);
            this.speed = 100 + (gameTime / 20);
            this.color = cfg.colors.enemyBasic;
            this.damage = 5;
            this.xpValue = 1;
        } else if (type === 1) {
            this.radius = 8;
            this.hp = 10 + (gameTime / 15);
            this.speed = 180 + (gameTime / 15);
            this.color = cfg.colors.enemyFast;
            this.damage = 3;
            this.xpValue = 2;
        } else {
            this.radius = 20;
            this.hp = 80 + (gameTime / 5);
            this.speed = 60 + (gameTime / 30);
            this.color = cfg.colors.enemyTank;
            this.damage = 15;
            this.xpValue = 5;
        }

        this.markedForDeletion = false;
        this.hitTimer = 0;
    }

    update(dt) {
        if (this.hitTimer > 0) this.hitTimer -= dt;

        // Mover hacia el jugador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Colisión con jugador
        if (dist < this.radius + player.radius) {
            // Un poco de "empuje" para que no se queden atascados dentro
            this.x -= (dx / dist) * 2;
            this.y -= (dy / dist) * 2;
            
            // Daño al jugador (limitado por frames para no matarlo instantáneamente)
            if (frameCount % 30 === 0) {
                player.takeDamage(this.damage);
                // Efecto visual de daño
                document.getElementById('game-container').style.boxShadow = 'inset 0 0 50px rgba(255,0,0,0.5)';
                setTimeout(() => document.getElementById('game-container').style.boxShadow = '', 100);
            }
        }
    }

    takeDamage(amount) {
        if (this.markedForDeletion) return;
        
        this.hp -= amount;
        this.hitTimer = 0.1; // Flash blanco
        
        // Número de daño
        damageTexts.push(new DamageText(this.x, this.y, Math.floor(amount)));

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            kills++;
            // Soltar gema
            if (Math.random() < 0.7) { // 70% chance to drop
                gems.push(new Gem(this.x, this.y, this.xpValue));
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitTimer > 0 ? cfg.colors.enemyHit : this.color;
        ctx.fill();
        ctx.strokeStyle = cfg.colors.enemyBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Projectile {
    constructor(x, y, angle, damage, speed, piercing, size) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.piercing = piercing;
        this.radius = size;
        this.color = cfg.colors.projectile;
        this.markedForDeletion = false;
        this.distanceTraveled = 0;
        this.maxDistance = 1000;
        this.hitEnemies = new Set(); // Para no dañar al mismo enemigo múltiples veces en un frame
    }

    update(dt) {
        const dx = this.vx * dt;
        const dy = this.vy * dt;
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.hypot(dx, dy);

        if (this.distanceTraveled > this.maxDistance) {
            this.markedForDeletion = true;
            return;
        }

        // Colisión con enemigos
        for (const enemy of enemies) {
            if (!this.hitEnemies.has(enemy)) {
                const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                if (dist < this.radius + enemy.radius) {
                    enemy.takeDamage(this.damage);
                    this.hitEnemies.add(enemy);
                    this.piercing--;
                    if (this.piercing <= 0) {
                        this.markedForDeletion = true;
                        break;
                    }
                }
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
    }
}

class Gem {
    constructor(x, y, value) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 20 - 10);
        this.value = value;
        this.radius = value > 2 ? 6 : 4;
        this.color = value > 2 ? cfg.colors.gemLarge : cfg.colors.gemSmall;
        this.markedForDeletion = false;
        
        // Animacion flotando
        this.startY = this.y;
        this.timeOffset = Math.random() * Math.PI * 2;
    }

    update(dt) {
        // Flotar
        this.y = this.startY + Math.sin(gameTime * 3 + this.timeOffset) * 5;

        // Atracción magnética al jugador si está cerca
        const pickupRadius = 100; // Podría ser una mejora
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < pickupRadius) {
            const pullSpeed = 400 * (1 - dist/pickupRadius);
            this.x += (dx / dist) * pullSpeed * dt;
            this.startY += (dy / dist) * pullSpeed * dt; // actualizamos startY en vez de y para que siga flotando

            if (dist < player.radius + this.radius) {
                player.gainXp(this.value);
                this.markedForDeletion = true;
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(Math.PI / 4); // Girar 45 grados para que sea un rombo
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        
        ctx.strokeStyle = cfg.colors.gemBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        
        ctx.restore();
    }
}

class DamageText {
    constructor(x, y, text) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y - 10;
        this.text = text.toString();
        this.lifeTime = 0.5; // Segundos
        this.maxLife = 0.5;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.y -= 50 * dt; // Flota hacia arriba
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) this.markedForDeletion = true;
    }

    draw(ctx, cameraX, cameraY) {
        const alpha = Math.max(0, this.lifeTime / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.font = '10px "Press Start 2P"';
        ctx.fillStyle = cfg.colors.damageText;
        // Borde negro
        ctx.lineWidth = 2;
        ctx.strokeStyle = cfg.colors.damageTextBorder;
        ctx.strokeText(this.text, this.x - cameraX, this.y - cameraY);
        ctx.fillText(this.text, this.x - cameraX, this.y - cameraY);
        ctx.globalAlpha = 1.0;
    }
}

// --- Sistemas ---

// Mejoras posibles
const UPGRADES = [
    { id: 'dmg', name: 'DAÑO+', desc: 'Aumenta todo el daño +20%', icon: '⚔️' },
    { id: 'rate', name: 'VELOCIDAD-', desc: 'Disparas 20% más rápido', icon: '⚡' },
    { id: 'pierce', name: 'PERFORACIÓN', desc: 'Proyectiles atraviesan +1 enemigo', icon: '🏹' },
    { id: 'speed', name: 'BOTAS', desc: 'Te mueves 15% más rápido', icon: '👟' },
    { id: 'aura', name: 'AURA', desc: 'Desbloquea/Mejora campo de daño', icon: '🟣' },
    { id: 'size', name: 'PROYECTIL BIG', desc: 'Balas más grandes', icon: '☄️' },
    { id: 'health', name: 'VIDA+', desc: 'Cura 50 y Max HP +25', icon: '❤️' }
];

function showLevelUpScreen() {
    keys.w = keys.a = keys.s = keys.d = keys.ArrowUp = keys.ArrowDown = keys.ArrowLeft = keys.ArrowRight = false;
    
    // Elegir 3 mejoras aleatorias únicas
    const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    
    upgradesContainer.innerHTML = '';
    
    choices.forEach(upg => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${upg.icon}</div>
            <div class="upgrade-title">${upg.name}</div>
            <div class="upgrade-desc">${upg.desc}</div>
        `;
        
        card.addEventListener('click', () => {
            applyUpgrade(upg.id);
            levelupScreen.classList.remove('active');
            gameState = 'PLAYING';
            lastTime = performance.now(); // Prevenir salto de frame
            requestAnimationFrame(gameLoop); // <-- FIX: Resume game loop
        });
        
        upgradesContainer.appendChild(card);
    });
    
    levelupScreen.classList.add('active');
}

function applyUpgrade(id) {
    switch (id) {
        case 'dmg': player.damageMtp *= 1.2; break;
        case 'rate': player.fireRate *= 1.2; break;
        case 'pierce': player.projPiercing += 1; break;
        case 'speed': player.speed *= 1.15; break;
        case 'aura': 
            if (!player.auraEnabled) { player.auraEnabled = true; }
            else { player.auraDamage += 5; player.auraRadius += 10; }
            break;
        case 'size': player.projSize += 3; break;
        case 'health': 
            player.maxHp += 25; 
            player.hp = Math.min(player.maxHp, player.hp + 50); 
            break;
    }
    player.updateUI();
}

function spawnEnemies(dt) {
    // Curva de dificultad (muy cruda)
    const spawnRate = Math.max(0.1, 1.0 - (gameTime / 120)); // Cae de 1s a 0.1s en 2 mins
    
    if (Math.random() < dt / spawnRate) {
        // Calcular que tipo spawnear basado en tiempo
        let type = 0;
        const r = Math.random();
        if (gameTime > 30 && r < 0.2) type = 1; // 20% rapidos despues de 30s
        if (gameTime > 60 && r < 0.1) type = 2; // 10% tanques despues de 60s
        
        // Spawn justo fuera de cámara
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(GAME_WIDTH, GAME_HEIGHT) / 2 + 50; // radio fuera de pantalla
        
        const spawnX = player.x + Math.cos(angle) * dist;
        const spawnY = player.y + Math.sin(angle) * dist;
        
        // Solo spawnear si está dentro del mapa válido
        if (spawnX > 0 && spawnX < MAP_SIZE && spawnY > 0 && spawnY < MAP_SIZE) {
            enemies.push(new Enemy(spawnX, spawnY, type));
        }
    }
}

function drawBackground(ctx, cameraX, cameraY) {
    // Fondo base
    ctx.fillStyle = cfg.colors.background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Cuadrícula simple para sensación de movimiento
    ctx.strokeStyle = cfg.colors.gridArea;
    ctx.lineWidth = 1;

    const gridSize = 100;
    const startX = -(cameraX % gridSize);
    const startY = -(cameraY % gridSize);

    ctx.beginPath();
    for (let x = startX; x < GAME_WIDTH; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
    }
    for (let y = startY; y < GAME_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
    }
    ctx.stroke();
    
    // Limites del mapa
    ctx.strokeStyle = cfg.colors.mapBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(-cameraX, -cameraY, MAP_SIZE, MAP_SIZE);
}

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- Main Loop ---

function startGame() {
    player = new Player();
    enemies = [];
    projectiles = [];
    gems = [];
    damageTexts = [];
    gameTime = 0;
    kills = 0;
    frameCount = 0;
    
    player.updateUI();
    
    startScreen.classList.remove('active');
    gameoverScreen.classList.remove('active');
    document.getElementById('start-btn').blur(); // quitar foco para que espacio no rebrote
    
    gameState = 'PLAYING';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    startGame();
}

function gameOver() {
    gameState = 'GAMEOVER';
    document.getElementById('final-time').textContent = formatTime(gameTime);
    document.getElementById('final-level').textContent = player.level;
    document.getElementById('final-kills').textContent = kills;
    gameoverScreen.classList.add('active');
}

function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') return;

    // Calcular dt asegurando un mínimo y un máximo para evitar lag spikes rompiendo fisica
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    gameTime += dt;
    frameCount++;

    // 1. Update
    player.update(dt);
    if(gameState !== 'PLAYING') return; // En caso de que haya muerto o subido de nivel este frame

    spawnEnemies(dt);

    enemies.forEach(e => e.update(dt));
    projectiles.forEach(p => p.update(dt));
    gems.forEach(g => g.update(dt));
    damageTexts.forEach(d => d.update(dt));

    // Limpieza
    enemies = enemies.filter(e => !e.markedForDeletion);
    projectiles = projectiles.filter(p => !p.markedForDeletion);
    gems = gems.filter(g => !g.markedForDeletion);
    damageTexts = damageTexts.filter(d => !d.markedForDeletion);

    // Update time UI (1 vez por segundo aprox)
    if (frameCount % 10 === 0) {
        timeDisplay.textContent = formatTime(gameTime);
    }

    // 2. Draw
    // Calcular cámara (centrada en el jugador)
    const cameraX = player.x - GAME_WIDTH / 2;
    const cameraY = player.y - GAME_HEIGHT / 2;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    drawBackground(ctx, cameraX, cameraY);
    
    // Sort array por Y para pseudo-3d depth
    const renderables = [...gems, ...enemies, player];
    renderables.sort((a, b) => a.y - b.y);

    // Dibujar elementos estáticos por debajo (proyectiles)
    projectiles.forEach(p => p.draw(ctx, cameraX, cameraY));
    
    // Dibujar entidades ordenadas
    renderables.forEach(r => r.draw(ctx, cameraX, cameraY));
    
    // UI superpuesta en canvas (textos de daño)
    damageTexts.forEach(d => d.draw(ctx, cameraX, cameraY));

    requestAnimationFrame(gameLoop);
}

// Iniciar en pantalla de inicio
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', resetGame);
