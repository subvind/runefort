import { GameEngine } from './game-engine';

const container = document.getElementById('game-container');
if (container) {
  console.log('found container')
  const game = new GameEngine(container);
}
