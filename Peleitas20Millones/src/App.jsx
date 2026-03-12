import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import CharacterSelectScreen from './screens/CharacterSelectScreen';
import BattleScreen from './screens/BattleScreen';
import GameOverScreen from './screens/GameOverScreen';
import './styles/variables.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [battleData, setBattleData] = useState(null);
  const [winner, setWinner] = useState(null);

  const goToSelection = () => setCurrentScreen('SELECTION');

  const startBattle = (p1, p2) => {
    setBattleData({ p1, p2 });
    setCurrentScreen('BATTLE');
  };

  const onGameOver = (winnerChar) => {
    setWinner(winnerChar);
    setCurrentScreen('GAME_OVER');
  };

  const restartGame = () => {
    setWinner(null);
    setCurrentScreen('SELECTION');
  };

  const goToHome = () => {
    setBattleData(null);
    setWinner(null);
    setCurrentScreen('HOME');
  };

  return (
    <div className="app-container">
      {currentScreen === 'HOME' && <HomeScreen onStart={goToSelection} />}
      {currentScreen === 'SELECTION' && (
        <CharacterSelectScreen
          onBack={() => setCurrentScreen('HOME')}
          onComplete={startBattle}
        />
      )}
      {currentScreen === 'BATTLE' && battleData && (
        <BattleScreen
          p1={battleData.p1}
          p2={battleData.p2}
          onGameOver={onGameOver}
        />
      )}
      {currentScreen === 'GAME_OVER' && winner && (
        <GameOverScreen
          winner={winner}
          onRestart={restartGame}
          onHome={goToHome}
        />
      )}
    </div>
  );
}

export default App;
