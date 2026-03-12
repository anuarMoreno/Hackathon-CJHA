// Configuración visual para Tetris. El motor sólo lee este objeto.

window.TETRIS_ASSETS = {
  images: {
    // Ejemplos:
    // cell: "./img/cell.png",
    // background: "./img/background.png",
    cell: null,
    background: null,
  },

  board: {
    cols: 10,
    rows: 20,
    cellSize: 32,
    backgroundColor: "#020617",
    gridColor: "rgba(148, 163, 184, 0.25)",
    borderColor: "#1f2937",
  },

  pieces: {
    I: "#22c55e",
    O: "#facc15",
    T: "#a855f7",
    L: "#f97316",
    J: "#38bdf8",
    S: "#4ade80",
    Z: "#fb7185",
  },

  ghost: {
    enabled: true,
    opacity: 0.25,
  },
};

