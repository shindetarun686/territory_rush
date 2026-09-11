// src/game/ai/aggressor.js
import { AIBase } from './aiBase.js';

/**
 * Aggressor AI – constantly moves toward the nearest player (or the main player).
 * For now it simply heads straight towards the player position each frame.
 */
export class Aggressor extends AIBase {
  constructor({ id, x, y, color, speed, target }) {
    super({ id, x, y, color, speed });
    this.target = target; // reference to player object
  }

  decideDirection(dt) {
    // Compute normalized vector toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.dir = { x: dx / len, y: dy / len };
    return this.dir;
  }
}
