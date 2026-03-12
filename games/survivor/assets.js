// Configuración de assets para Arcade Survivor
// Edita estos valores para cambiar la apariencia del juego

window.SURVIVOR_ASSETS = {
  // Opcional: Rutas a imágenes. Si se dejan vacías o nulas, se usarán formas geométricas
  images: {
    player: null,     // Ejemplo: "./assets/player.png"
    enemyBasic: null, // Ejemplo: "./assets/zombie.png"
    enemyFast: null,  // Ejemplo: "./assets/bat.png"
    enemyTank: null,  // Ejemplo: "./assets/ogre.png"
    gem: null,        // Ejemplo: "./assets/gem.png"
    projectile: null, // Ejemplo: "./assets/fireball.png"
    background: null  // Ejemplo: "./assets/ground.png"
  },

  // Configuración de colores (se usa si no hay imágenes)
  colors: {
    background: '#111111',
    gridArea: '#222222',
    mapBorder: '#ff0000',
    
    player: '#00fff7',
    playerAura: 'rgba(255, 0, 222, 0.15)',
    playerAuraBorder: 'rgba(255, 0, 222, 0.5)',
    
    enemyBasic: '#ff3333',
    enemyFast: '#ff9900',
    enemyTank: '#aa0000',
    enemyHit: '#ffffff',
    enemyBorder: '#000000',
    
    projectile: '#ffff00',
    
    gemSmall: '#00ff44',
    gemLarge: '#00bbff',
    gemBorder: '#ffffff',
    
    damageText: '#ffffff',
    damageTextBorder: '#000000'
  }
};
