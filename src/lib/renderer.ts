import { GameEngine } from './game-engine/GameEngine';

const container = document.getElementById('game-container');
if (container) {
  console.log('found container')
  const game = new GameEngine(container);
}