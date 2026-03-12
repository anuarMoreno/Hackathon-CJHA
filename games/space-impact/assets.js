window.SPACE_ASSETS = {
  background: {
    skyColor: "#020617",
    starsCount: 60,
    starColor: "rgba(148, 163, 184, 0.7)",
    nebulaColor: "rgba(56, 189, 248, 0.04)",
  },

  ship: {
    width: 36,
    height: 20,
    color: "#38bdf8",
    cockpitColor: "#0ea5e9",
    flameColor: "#f97316",
    flameColorAlt: "#facc15",
    speed: 5,
    fireRate: 180,
  },

  bullet: {
    width: 14,
    height: 3,
    color: "#38bdf8",
    speed: 10,
  },

  enemies: {
    basic: {
      width: 28,
      height: 18,
      color: "#f97316",
      accentColor: "#fdba74",
      speed: 2.5,
      hp: 1,
      score: 10,
    },
    fast: {
      width: 22,
      height: 14,
      color: "#a855f7",
      accentColor: "#d8b4fe",
      speed: 4.5,
      hp: 1,
      score: 15,
    },
    tank: {
      width: 36,
      height: 24,
      color: "#ef4444",
      accentColor: "#fca5a5",
      speed: 1.5,
      hp: 3,
      score: 30,
    },
    boss: {
      width: 60,
      height: 48,
      color: "#dc2626",
      accentColor: "#fca5a5",
      coreColor: "#f97316",
      speed: 1,
      hp: 30,
      score: 200,
      fireRate: 800,
    },
  },

  enemyBullet: {
    width: 10,
    height: 3,
    color: "#ef4444",
    speed: 5,
  },

  powerUp: {
    size: 16,
    speed: 1.5,
    types: {
      trishot: { color: "#22c55e", label: "T" },
      shield: { color: "#3b82f6", label: "S" },
      rapidfire: { color: "#eab308", label: "R" },
    },
  },

  explosion: {
    particleCount: 12,
    colors: ["#f97316", "#facc15", "#ef4444", "#fff"],
    duration: 400,
  },

  waves: {
    enemiesPerWave: 8,
    wavePause: 2000,
    bossEveryNWaves: 5,
  },
};
