// src/game/input.js
// Simple keyboard input handling (WASD / Arrow keys)

export function initInput() {
  const state = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  function keyDown(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        state.left = true; break;
      case 'ArrowRight':
      case 'KeyD':
        state.right = true; break;
      case 'ArrowUp':
      case 'KeyW':
        state.up = true; break;
      case 'ArrowDown':
      case 'KeyS':
        state.down = true; break;
    }
  }

  function keyUp(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        state.left = false; break;
      case 'ArrowRight':
      case 'KeyD':
        state.right = false; break;
      case 'ArrowUp':
      case 'KeyW':
        state.up = false; break;
      case 'ArrowDown':
      case 'KeyS':
        state.down = false; break;
    }
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  // Returns a normalized direction vector based on current key state
  function getDirection() {
    let dx = 0, dy = 0;
    if (state.left) dx -= 1;
    if (state.right) dx += 1;
    if (state.up) dy -= 1;
    if (state.down) dy += 1;
    if (dx === 0 && dy === 0) return { x: 0, y: 0 };
    const len = Math.hypot(dx, dy);
    return { x: dx / len, y: dy / len };
  }

  return { getDirection };
}
