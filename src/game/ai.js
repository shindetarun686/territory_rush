// src/game/ai.js
import { ARENA_CENTER, ARENA_RADIUS, CELL_SIZE } from './world.js';
import { CHARACTER_SKINS } from '../data/skins.js';

export const AI_NAMES = [
  'julia', 'marcelo', 'mohamed', 'lucas', 'sophia', 'alex', 'elena', 'leo', 'emma', 'david'
];

export const AI_COLORS = [
  '#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#9b59b6', '#ff6b81', '#70a1ff', '#2bcbba'
];

export const AI_PERSONALITIES = [
  'AGGRESSOR', 'EXPLORER', 'DEFENDER', 'HUNTER', 'SPEEDSTER', 'STRATEGIST'
];

export class AIPlayer {
  constructor({ id, name, color, personality, x, y, speed = 210 }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.personality = personality;
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
    this.baseSpeed = speed;
    this.speed = speed;
    this.radius = 15;

    this.trail = [];
    this.isOutside = false;
    this.alive = true;
    this.kills = 0;
    this.score = 0;
    this.territoryPercent = 0;

    this.state = 'wander';
    this.stateTimer = 0;
    this.trailMaxLen = 120;

    if (personality === 'SPEEDSTER') {
      this.speed *= 1.15;
      this.trailMaxLen = 160;
    } else if (personality === 'STRATEGIST') {
      this.trailMaxLen = 75;
    } else if (personality === 'EXPLORER') {
      this.trailMaxLen = 140;
    }

    this.skin = CHARACTER_SKINS[Math.floor(Math.random() * CHARACTER_SKINS.length)];
  }

  update(dt, world, player, allAIs) {
    if (!this.alive) return;

    const { gx, gy } = world.worldToGrid(this.x, this.y);
    const cellOwner = world.getCell(gx, gy);
    const wasOutside = this.isOutside;
    this.isOutside = (cellOwner !== this.id);

    if (!wasOutside && this.isOutside) {
      this.trail = [{ x: this.x, y: this.y }];
    } else if (this.isOutside) {
      const last = this.trail[this.trail.length - 1];
      if (!last || Math.hypot(this.x - last.x, this.y - last.y) > 10) {
        this.trail.push({ x: this.x, y: this.y });
      }
    }

    this.decideMovement(dt, world, player, allAIs);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const maxRadius = ARENA_RADIUS - Math.max(8, this.radius * 0.45);
    const distFromCenter = Math.hypot(this.x - ARENA_CENTER, this.y - ARENA_CENTER);
    if (distFromCenter > maxRadius) {
      const angleFromCenter = Math.atan2(this.y - ARENA_CENTER, this.x - ARENA_CENTER);
      this.x = ARENA_CENTER + Math.cos(angleFromCenter) * maxRadius;
      this.y = ARENA_CENTER + Math.sin(angleFromCenter) * maxRadius;
      this.steerTowards(ARENA_CENTER, ARENA_CENTER);
    }

    this.angle = Math.atan2(this.vy, this.vx);
  }

  decideMovement(dt, world, player, allAIs) {
    this.stateTimer -= dt;

    let closestEnemyTrailPt = null;
    let closestEnemyDist = 99999;

    const checkTrails = (entity) => {
      if (!entity.alive || entity.id === this.id || !entity.isOutside || entity.trail.length < 2) return;
      for (let i = 0; i < entity.trail.length - 3; i++) {
        const pt = entity.trail[i];
        const d = Math.hypot(this.x - pt.x, this.y - pt.y);
        if (d < closestEnemyDist) {
          closestEnemyDist = d;
          closestEnemyTrailPt = pt;
        }
      }
    };

    checkTrails(player);
    for (const otherAI of allAIs) {
      checkTrails(otherAI);
    }

    if ((this.personality === 'HUNTER' || this.personality === 'AGGRESSOR') && closestEnemyTrailPt && closestEnemyDist < 500) {
      this.steerTowards(closestEnemyTrailPt.x, closestEnemyTrailPt.y);
      return;
    }

    if (this.isOutside && (this.trail.length >= this.trailMaxLen || (this.stateTimer <= 0 && this.state === 'returning'))) {
      const homePt = this.findNearestOwnedCell(world);
      if (homePt) {
        this.steerTowards(homePt.x, homePt.y);
        return;
      }
    }

    if (this.stateTimer <= 0) {
      this.stateTimer = 1.5 + Math.random() * 2.0;

      if (!this.isOutside) {
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.state = 'expanding';
      } else {
        const currentAngle = Math.atan2(this.vy, this.vx);
        const turn = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2);
        const newAngle = currentAngle + turn;
        this.vx = Math.cos(newAngle) * this.speed;
        this.vy = Math.sin(newAngle) * this.speed;
        this.state = 'returning';
      }
    }
  }

  steerTowards(tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
  }

  findNearestOwnedCell(world) {
    const { gx: cx, gy: cy } = world.worldToGrid(this.x, this.y);
    let bestDist = 99999;
    let bestPos = null;

    const r = 25;
    for (let dy = -r; dy <= r; dy += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (world.getCell(gx, gy) === this.id) {
          const wp = world.gridToWorld(gx, gy);
          const d = Math.hypot(this.x - wp.wx, this.y - wp.wy);
          if (d < bestDist) {
            bestDist = d;
            bestPos = { x: wp.wx, y: wp.wy };
          }
        }
      }
    }
    return bestPos;
  }

  render(ctx, camera) {
    if (!this.alive) return;
    const sp = camera.worldToScreen(this.x, this.y);

    // Draw exposed solid flat ribbon trail
    if (this.isOutside && this.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 20 * camera.zoom;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      const p0 = camera.worldToScreen(this.trail[0].x, this.trail[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < this.trail.length; i++) {
        const pi = camera.worldToScreen(this.trail[i].x, this.trail[i].y);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.lineTo(sp.x, sp.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Square AI Head
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(this.angle);

    const headSize = 22 * camera.zoom;
    ctx.fillStyle = this.color;
    ctx.fillRect(-headSize / 2, -headSize / 2, headSize, headSize);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.strokeRect(-headSize / 2, -headSize / 2, headSize, headSize);

    // Name tag
    ctx.rotate(-this.angle);
    ctx.fillStyle = '#1e293b';
    ctx.font = `800 ${Math.max(10, Math.floor(11 * camera.zoom))}px "Nunito", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, -headSize * 0.7 - 2);

    ctx.restore();
  }
}
