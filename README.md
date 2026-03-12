# Hackathon-CJHA - Game Catalog

A collection of mini-games built with vanilla HTML, CSS, and JavaScript. Each game lives in its own folder under `games/` and is accessible from a central arcade-style launcher.

The project demonstrates how fast you can prototype classic games using nothing but the browser's built-in APIs -- no frameworks, no bundlers, no dependencies.

## Games

| Game | Language | Description |
|------|----------|-------------|
| **Dino Runner** | JavaScript (Canvas API) | A customizable Chrome-style dinosaur runner. Jump over obstacles, beat your high score, and reskin the entire game by editing a single config file (`assets.js`). |

## Project Structure

```
.
├── index.html              # Main game catalog / launcher
├── games/
│   └── dino/
│       ├── index.html      # Dino Runner page
│       ├── styles.css      # Dino Runner styling
│       ├── game.js         # Game engine (physics, rendering, loop)
│       └── assets.js       # Declarative visual config (colors, sizes, shapes)
├── LICENSE                 # MIT License
└── README.md
```

## Getting Started

No build step required. Clone the repo and open `index.html` in any modern browser.

```bash
git clone https://github.com/anuarMoreno/Hackathon-CJHA.git
cd Hackathon-CJHA
open index.html
```

## Adding a New Game

1. Create a new folder under `games/` (e.g. `games/snake/`).
2. Add your game files (`index.html`, scripts, styles).
3. Add a new game card to the root `index.html` grid.

## Customizing the Dino Runner

Edit `games/dino/assets.js` to change:

- **Dino**: color, size, and shape style (`boxy`, `round`, or `robot`).
- **Obstacles**: width, height range, color, and spawn gap.
- **Background**: sky color, ground color, and decorative details (mountains, stars).

No game logic changes needed -- the engine reads the config at runtime.

## Technologies

- HTML5
- CSS3 (custom properties, grid, flexbox, backdrop-filter)
- Vanilla JavaScript (ES6+)
- Canvas 2D API

## License

This project is licensed under the [MIT License](LICENSE).
