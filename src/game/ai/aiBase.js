// src/game/ai/aiBase.js
/**
 * Base AI class – represents a non‑player entity that moves around the world.
 * Sub‑classes can override decideDirection(dt) to implement personalities.
 */
export class AIBase {
  constructor({ id, x, y, color, speed }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.color = color;
    this.speed = speed; // units per second
    this.state = 'idle';
    this.trail = [];
    // Direction vector (normalized)
    this.dir = { x: 0, y: 0 };
    this.changeDirection(); // initial random direction
    this.changeTimer = 0; // time until next direction change
  }

  // Randomly pick a new direction (normalized)
  changeDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.dir = { x: Math.cos(angle), y: Math.sin(angle) };
  }

  // Called each frame – subclasses may replace this with smarter logic
  decideDirection(dt) {
    // Simple wander: change direction every 1‑2 seconds
    this.changeTimer -= dt;
    if (this.changeTimer <= 0) {
      this.changeDirection();
      this.changeTimer = 1 + Math.random();
    }
    return this.dir;
  }

  update(dt, worldSize) {
    const dir = this.decideDirection(dt);
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
    // Wrap around world edges
    this.x = (this.x + worldSize) % worldSize;
    this.y = (this.y + worldSize) % worldSize;
    // Keep a short trail for future combat logic (optional)
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 100) this.trail.shift();
  }

  render(ctx, camera) {
    const screenPos = camera.worldToScreen(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  renderTrail(ctx, camera) {
    if (this.trail.length < 2) return;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const start = camera.worldToScreen(this.trail[0].x, this.trail[0].y);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < this.trail.length; i++) {
      const p = camera.worldToScreen(this.trail[i].x, this.trail[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}
