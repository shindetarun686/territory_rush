// src/game/battleRoyale.js

/**
 * Battle Royale mode – a shrinking safe zone (ring) that damages players outside it.
 * The ring is centered on the arena and shrinks over time.
 */
export class BattleRoyale {
  /**
   * @param {number} arenaSize – size of the arena in world units (e.g., WORLD_SIZE).
   * @param {object} options – configuration options.
   */
  constructor(arenaSize, options = {}) {
    this.centerX = arenaSize / 2;
    this.centerY = arenaSize / 2;
    // Start radius as a fraction of arena size (default 0.45 → 90% of half‑size)
    this.ringRadius = (options.startRadiusFraction ?? 0.45) * arenaSize;
    // Shrink rate in units per second (default 10% of initial radius per minute)
    this.shrinkRate = options.shrinkRate ?? (this.ringRadius / 60);
    this.minRadius = options.minRadius ?? arenaSize * 0.1;
    this.isActive = false;
  }

  /** Activate the ring for a new match */
  start() {
    this.isActive = true;
  }

  /** Stop (e.g., match ended) */
  stop() {
    this.isActive = false;
  }

  /** Update radius based on delta time */
  update(dt) {
    if (!this.isActive) return;
    this.ringRadius -= this.shrinkRate * dt;
    if (this.ringRadius < this.minRadius) this.ringRadius = this.minRadius;
  }

  /** Check if a point (world coordinates) lies inside the safe zone */
  isInside(x, y) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return Math.hypot(dx, dy) <= this.ringRadius;
  }

  /** Render the ring onto the canvas (screen‑space) */
  renderRing(ctx, camera) {
    if (!this.isActive) return;
    const screenCenter = camera.worldToScreen(this.centerX, this.centerY);
    const screenRadius = this.ringRadius * camera.zoom;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 4 * camera.zoom;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
