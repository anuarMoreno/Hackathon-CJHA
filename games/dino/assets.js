// Configuración de assets para el juego del dino.
// Cambia este objeto para personalizar el aspecto sin tocar la lógica del juego.

window.DINO_ASSETS = {
  // Opcional: rutas de imágenes. Si faltan, se usan las formas por defecto.
  images: {
    // Pon aquí tus propios archivos (por ejemplo en games/dino/img/).
    // Ejemplos:
    // dino: "./img/dino.png",
    // obstacle: "./img/cactus.png",
    // background: "./img/background.png",
    dino: null,
    obstacle: null,
    background: null,
  },

  background: {
    skyColor: "#020617",
    groundColor: "#111827",
    groundHeight: 36,
    lineColor: "#6b7280",
    accentColor: "#4ade80",
    details: true, // si hay montañas y estrellitas extra
  },

  dino: {
    width: 40,
    height: 44,
    color: "#22c55e",
    eyeColor: "#020617",
    legColor: "#16a34a",
    // Puedes cambiar "boxy" por "round" o "robot" si quieres otra silueta básica
    style: "boxy",
  },

  obstacle: {
    baseWidth: 18,
    minHeight: 28,
    maxHeight: 60,
    color: "#f97316",
    accentColor: "#fed7aa",
    gapMin: 220,
    gapMax: 360,
  },
};

