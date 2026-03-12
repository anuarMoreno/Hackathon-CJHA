# Arcade Game Catalog

A retro-style arcade game launcher showcasing various mini-games. By default, it features vanilla HTML/CSS/JS games, but the catalog is designed to be easily extensible to include built applications (like those made with Vite, React, Vue, etc.).

## Games Available

| Game | Language | Description |
|------|----------|-------------|
| **Dino Runner** | JavaScript (Canvas API) | A customizable Chrome-style dinosaur runner. Jump over obstacles, beat your high score, and reskin the entire game by editing a single config file (`assets.js`). |

## Project Structure

```text
.
├── index.html              # Main arcade game catalog / launcher
├── games.json              # Central catalog configuration (ADD GAMES HERE)
├── games/                  # Folder where all games are stored
│   └── dino/               # Example vanilla JS game
│       ├── index.html      # Dino Runner entry point
│       ├── styles.css      
│       ├── game.js         
│       └── assets.js       
├── LICENSE                 # MIT License
└── README.md               # This file
```

## Getting Started

To run the catalog locally, simply use any static local server. Because the catalog uses `fetch()` to load the `games.json` list, opening `index.html` directly via the `file://` protocol may cause a CORS error in some browsers.

Using Node.js (npx):
```bash
git clone https://github.com/anuarMoreno/Hackathon-CJHA.git
cd Hackathon-CJHA
npx serve .
```

Using Python:
```bash
python3 -m http.server
```

## Adding a New Game to the Catalog

The menu is completely dynamic. To add a new game, you don't need to touch the main HTML file. 

1. Add your game to the `games/` folder (e.g., `games/my-new-game/`).
2. Open `games.json` in the root directory.
3. Add a new JSON object to the array following this format:

```json
{
  "id": "my_game_id",
  "title": "MY NEW GAME",
  "url": "./games/my-new-game/index.html",
  "iconText": "[ MY_GAME.EXE ]",
  "description": "A short description of what my amazing game does.",
  "tags": [
    { "label": "JavaScript", "type": "js" },
    { "label": "Vite", "type": "quick" }
  ]
}
```

*Note: For the tag `type`, you can use `js` (yellow), `canvas` (orange), or `quick` (green) for automatic retro styling.*

## Support for Vite / Bundled Games

You can easily integrate games built with modern bundlers like **Vite**, React, or Vue. 

Because the Arcade Catalog expects static paths, you need to configure your Vite project to build with relative paths so it can be hosted inside the `games/` subfolder.

**Steps for Vite Games:**
1. In your Vite project's `vite.config.js`, set the `base` path to relative:
   ```javascript
   // vite.config.js
   export default {
     base: './', // CRITICAL: This ensures assets load relatively
     build: {
       outDir: 'dist'
     }
   }
   ```
2. Run your build command (`npm run build`).
3. Copy the contents of your `dist/` folder into a new subfolder in the catalog, e.g., `Hackathon-CJHA/games/my-vite-game/`.
4. Add the entry to `games.json` pointing to `./games/my-vite-game/index.html`.

## Customizing the Dino Runner

Edit `games/dino/assets.js` to change:
- **Dino**: color, size, and shape style (`boxy`, `round`, or `robot`).
- **Obstacles**: width, height range, color, and spawn gap.
- **Background**: sky color, ground color, and decorative details.

## Technologies
- HTML5 & CSS3 (Animations, Custom Properties, Flexbox, CSS Grid)
- Vanilla JavaScript (Dynamic JSON fetching, DOM manipulation)
- Canvas 2D API (For included games)

## License
This project is licensed under the [MIT License](LICENSE).
