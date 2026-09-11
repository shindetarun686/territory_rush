// src/main.js
import { GameManager } from './game/game.js';
import { UIManager } from './ui/ui.js';
import { audio } from './game/audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // First user interaction unlocks Web Audio API
  const unlockAudio = () => {
    audio.init();
    audio.resume();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // Initialize Game & UI Managers
  const game = new GameManager(canvas);
  const ui = new UIManager(game);

  // Main Loop
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    game.update(dt);
    game.render();
    ui.updateHUD();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
