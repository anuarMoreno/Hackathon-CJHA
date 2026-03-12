// Configuración personalizable para Breakout.
// Igual que en el Dino, puedes usar colores o sprites opcionales.

window.BREAKOUT_ASSETS = {
  images: {
    // Ejemplos:
    // paddle: "./img/paddle.png",
    // ball: "./img/ball.png",
    // background: "./img/background.png",
    // blocks: "./img/blocks.png", // sprite sheet o bloque único
    paddle: null,
    ball: null,
    background: null,
    blocks: null,
  },

  background: {
    color: "#020617",
    borderColor: "#1f2937",
  },

  paddle: {
    width: 96,
    height: 16,
    color: "#38bdf8",
    speed: 5,
  },

  ball: {
    radius: 7,
    color: "#f97316",
    speed: 2.2,
  },

  blocks: {
    rows: 5,
    cols: 10,
    padding: 4,
    topOffset: 50,
    leftOffset: 32,
    rowColors: ["#f97316", "#facc15", "#22c55e", "#38bdf8", "#a855f7"],
  },
};

