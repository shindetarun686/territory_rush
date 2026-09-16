// src/game/continuousTrail.js

/**
 * Stores a high‑resolution trail of points for a player or AI.
 * Used for capture calculations; points are added each frame when the
 * entity is outside its own territory.
 */
export class ContinuousTrail {
  constructor() {
    this.points = [];
  }

  /** Add a new point (world coordinates) */
  addPoint(x, y) {
    this.points.push({ x, y });
  }

  /** Clear the trail */
  reset() {
    this.points = [];
  }

  /** Return a shallow copy of the points */
  getPoints() {
    return this.points.slice();
  }
}
