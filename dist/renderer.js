"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_engine_1 = require("./game-engine");
const container = document.getElementById('game-container');
if (container) {
    const game = new game_engine_1.GameEngine(container);
}
