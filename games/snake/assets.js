window.SNAKE_ASSETS = {
  grid: {
    cols: 20,
    rows: 15,
    cellSize: 28,
    bgColor: "#0a0f1a",
    gridLineColor: "rgba(56, 189, 248, 0.06)",
    borderColor: "rgba(56, 189, 248, 0.25)",
  },

  snake: {
    headColor: "#4ade80",
    bodyColor: "#22c55e",
    bodyColorAlt: "#16a34a",
    eyeColor: "#020617",
    glowColor: "rgba(74, 222, 128, 0.35)",
    tongueColor: "#ef4444",
    initialLength: 3,
    speed: 140,
    speedIncrease: 2,
    minSpeed: 60,
  },

  apple: {
    color: "#ef4444",
    stemColor: "#65a30d",
    leafColor: "#4ade80",
    glowColor: "rgba(239, 68, 68, 0.4)",
    shineSColor: "rgba(255, 255, 255, 0.5)",
    pulseSpeed: 0.06,
    score: 10,
  },

  golden: {
    color: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.5)",
    score: 50,
    chance: 0.12,
    duration: 5000,
  },

  particles: {
    count: 10,
    colors: ["#4ade80", "#22c55e", "#ef4444", "#fbbf24", "#fff"],
    duration: 500,
  },
};
