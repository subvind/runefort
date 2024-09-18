import { GameEngine } from './game-engine';

const container = document.getElementById('game-container');
if (container) {
    const game = new GameEngine(container);
}
