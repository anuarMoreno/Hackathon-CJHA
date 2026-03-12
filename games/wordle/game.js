const levels = [
  "cursor",
  "codigo",
  "script",
  "server",
  "hacker",
  "string",
  "objeto",
  "branch",
  "deploy",
  "python"
];

let currentLevel = 0;
let targetWord = levels[currentLevel].toUpperCase();

const GUESSES = 6;
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;

const board = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageContainer = document.getElementById('message-container');
const levelIndicator = document.getElementById('level-indicator');

const guessRows = [];

// Initialize game
function initBoard() {
  board.innerHTML = '';
  guessRows.length = 0;
  
  for (let i = 0; i < GUESSES; i++) {
    const row = document.createElement('div');
    row.classList.add('board-row');
    row.setAttribute('id', `row-${i}`);
    
    for (let j = 0; j < targetWord.length; j++) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.setAttribute('id', `row-${i}-tile-${j}`);
      row.appendChild(tile);
    }
    
    board.appendChild(row);
    guessRows.push(new Array(targetWord.length).fill(''));
  }
}

function resetGame() {
  targetWord = levels[currentLevel].toUpperCase();
  currentRow = 0;
  currentTile = 0;
  isGameOver = false;
  messageContainer.innerHTML = '';
  levelIndicator.textContent = `Nivel ${currentLevel + 1}/${levels.length}`;
  
  // Reset keyboard
  const keys = keyboard.querySelectorAll('button');
  keys.forEach(key => {
    key.removeAttribute('data-state');
  });
  
  initBoard();
}

function showMessage(msg, sticky = false) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message');
  if (sticky) messageEl.classList.add('sticky');
  messageEl.textContent = msg;
  
  messageContainer.innerHTML = '';
  messageContainer.appendChild(messageEl);
}

function addLetter(letter) {
  if (currentTile < targetWord.length && currentRow < GUESSES) {
    const tile = document.getElementById(`row-${currentRow}-tile-${currentTile}`);
    tile.textContent = letter;
    tile.setAttribute('data-state', 'active');
    guessRows[currentRow][currentTile] = letter;
    currentTile++;
  }
}

function deleteLetter() {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.getElementById(`row-${currentRow}-tile-${currentTile}`);
    tile.textContent = '';
    tile.removeAttribute('data-state');
    guessRows[currentRow][currentTile] = '';
  }
}

function checkRow() {
  const guess = guessRows[currentRow].join('');

  if (currentTile < targetWord.length) {
    showMessage('Palabra muy corta');
    document.getElementById(`row-${currentRow}`).classList.add('shake');
    setTimeout(() => {
      document.getElementById(`row-${currentRow}`).classList.remove('shake');
    }, 500);
    return;
  }

  // Coloring logic
  const targetLetters = Array.from(targetWord);
  const guessLetters = Array.from(guess);
  const tileStates = new Array(targetWord.length).fill('absent');

  // First pass: correct
  guessLetters.forEach((letter, i) => {
    if (letter === targetLetters[i]) {
      tileStates[i] = 'correct';
      targetLetters[i] = null;
    }
  });

  // Second pass: present
  guessLetters.forEach((letter, i) => {
    if (tileStates[i] === 'absent' && targetLetters.includes(letter)) {
      tileStates[i] = 'present';
      targetLetters[targetLetters.indexOf(letter)] = null;
    }
  });

  // Apply colors to board and keyboard
  guessLetters.forEach((letter, i) => {
    const tile = document.getElementById(`row-${currentRow}-tile-${i}`);
    const key = keyboard.querySelector(`[data-key="${letter.toLowerCase()}"]`);

    setTimeout(() => {
      tile.setAttribute('data-state', tileStates[i]);

      // Update keyboard stats
      const keyState = key.getAttribute('data-state');
      if (tileStates[i] === 'correct') {
        key.setAttribute('data-state', 'correct');
      } else if (tileStates[i] === 'present' && keyState !== 'correct') {
        key.setAttribute('data-state', 'present');
      } else if (tileStates[i] === 'absent' && keyState !== 'correct' && keyState !== 'present') {
        key.setAttribute('data-state', 'absent');
      }
    }, i * 150);
  });

  if (guess === targetWord) {
    isGameOver = true;
    setTimeout(() => {
      if (currentLevel < levels.length - 1) {
        showMessage('¡Correcto! Presiona Enter para el siguiente nivel.', true);
      } else {
        showMessage('¡Felicidades! Completaste todos los niveles.', true);
      }
    }, targetWord.length * 150);
  } else {
    currentRow++;
    currentTile = 0;
    
    if (currentRow >= GUESSES) {
      isGameOver = true;
      setTimeout(() => {
        showMessage(`Fin del juego. La palabra era ${targetWord}. Presiona Enter para reiniciar.`, true);
      }, targetWord.length * 150);
    }
  }
}

function handleInput(key) {
  if (isGameOver) {
    if (key === 'enter' || key === 'ENTER') {
      const guess = guessRows[currentRow] ? guessRows[currentRow].join('') : '';
      if (guess === targetWord && currentLevel < levels.length - 1) {
        currentLevel++;
        resetGame();
      } else if (currentRow >= GUESSES || currentLevel === levels.length - 1) {
        currentLevel = 0; // Restart from level 1
        resetGame();
      }
    }
    return;
  }

  if (key === 'backspace' || key === 'del' || key === 'delete') {
    deleteLetter();
  } else if (key === 'enter') {
    checkRow();
  } else if (/^[a-zA-Z]$/.test(key)) {
    addLetter(key.toUpperCase());
  }
}

// Event listeners
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  handleInput(key);
});

keyboard.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const key = e.target.getAttribute('data-key');
    handleInput(key);
  }
});

// Start game
resetGame();
