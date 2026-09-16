// src/game/world.js

export const WORLD_SIZE = 4000;
export const ARENA_CENTER = WORLD_SIZE / 2;
export const ARENA_RADIUS = 1850; // Circular arena playable radius
export const GRID_COLS = 160;
export const GRID_ROWS = 160;
export const CELL_SIZE = WORLD_SIZE / GRID_COLS; // 25 px per cell
export const TOTAL_GRID_CELLS = GRID_COLS * GRID_ROWS;

export class WorldGrid {
  constructor() {
    this.grid = new Uint8Array(TOTAL_GRID_CELLS);
    this.cellCounts = {};

    // Precalculate playable cells inside the circular arena
    this.playableMask = new Uint8Array(TOTAL_GRID_CELLS);
    this.totalPlayableCells = 0;

    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        const wp = this.gridToWorld(gx, gy);
        const distFromCenter = Math.hypot(wp.wx - ARENA_CENTER, wp.wy - ARENA_CENTER);
        const idx = gy * GRID_COLS + gx;
        if (distFromCenter <= ARENA_RADIUS) {
          this.playableMask[idx] = 1;
          this.totalPlayableCells++;
        }
      }
    }
  }

  reset() {
    this.grid.fill(0);
    this.cellCounts = {};
    this.paths = null;
  }

  coordToIndex(gx, gy) {
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return -1;
    return gy * GRID_COLS + gx;
  }

  worldToGrid(wx, wy) {
    const gx = Math.floor(Math.max(0, Math.min(WORLD_SIZE - 1, wx)) / CELL_SIZE);
    const gy = Math.floor(Math.max(0, Math.min(WORLD_SIZE - 1, wy)) / CELL_SIZE);
    return { gx, gy };
  }

  gridToWorld(gx, gy) {
    return {
      wx: gx * CELL_SIZE + CELL_SIZE / 2,
      wy: gy * CELL_SIZE + CELL_SIZE / 2
    };
  }

  isInsideCircle(wx, wy, margin = 0) {
    return Math.hypot(wx - ARENA_CENTER, wy - ARENA_CENTER) <= (ARENA_RADIUS - margin);
  }

  getCell(gx, gy) {
    const idx = this.coordToIndex(gx, gy);
    if (idx === -1 || !this.playableMask[idx]) return 0;
    return this.grid[idx];
  }

  setCell(gx, gy, ownerId) {
    const idx = this.coordToIndex(gx, gy);
    if (idx === -1 || !this.playableMask[idx]) return;
    const oldOwner = this.grid[idx];
    if (oldOwner === ownerId) return;
    this.paths = null;

    if (oldOwner > 0) {
      this.cellCounts[oldOwner] = Math.max(0, (this.cellCounts[oldOwner] || 1) - 1);
    }
    this.grid[idx] = ownerId;
    if (ownerId > 0) {
      this.cellCounts[ownerId] = (this.cellCounts[ownerId] || 0) + 1;
    }
  }

  spawnInitialTerritory(ownerId, centerX, centerY, radiusCells = 5) {
    const { gx: cx, gy: cy } = this.worldToGrid(centerX, centerY);
    for (let dy = -radiusCells; dy <= radiusCells; dy++) {
      for (let dx = -radiusCells; dx <= radiusCells; dx++) {
        if (dx * dx + dy * dy <= radiusCells * radiusCells) {
          const gx = cx + dx;
          const gy = cy + dy;
          if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
            this.setCell(gx, gy, ownerId);
          }
        }
      }
    }
  }

  clearOwner(ownerId) {
    this.paths = null;
    for (let i = 0; i < TOTAL_GRID_CELLS; i++) {
      if (this.grid[i] === ownerId) {
        this.grid[i] = 0;
      }
    }
    delete this.cellCounts[ownerId];
  }

  // --- Circular Flood Fill Territory Capture ---
  captureTerritory(ownerId, trailPoints) {
    if (!trailPoints || trailPoints.length < 3) return { captured: 0, total: this.cellCounts[ownerId] || 0, percent: '0.00' };

    const trailMask = new Uint8Array(TOTAL_GRID_CELLS);
    for (let i = 0; i < trailPoints.length - 1; i++) {
      const p1 = this.worldToGrid(trailPoints[i].x, trailPoints[i].y);
      const p2 = this.worldToGrid(trailPoints[i + 1].x, trailPoints[i + 1].y);

      let x0 = p1.gx, y0 = p1.gy;
      const x1 = p2.gx, y1 = p2.gy;
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;

      while (true) {
        const idx = this.coordToIndex(x0, y0);
        if (idx !== -1 && this.playableMask[idx]) trailMask[idx] = 1;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }

    // Outer BFS starting from all non-playable outer cells & borders
    const outside = new Uint8Array(TOTAL_GRID_CELLS);
    const queueX = new Int16Array(TOTAL_GRID_CELLS);
    const queueY = new Int16Array(TOTAL_GRID_CELLS);
    let qHead = 0, qTail = 0;

    const pushQueue = (gx, gy) => {
      const idx = this.coordToIndex(gx, gy);
      if (idx !== -1 && !outside[idx] && this.grid[idx] !== ownerId && !trailMask[idx]) {
        outside[idx] = 1;
        queueX[qTail] = gx;
        queueY[qTail] = gy;
        qTail++;
      }
    };

    // Push all outer border cells and unplayable circular margin cells
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        const idx = gy * GRID_COLS + gx;
        if (!this.playableMask[idx]) {
          pushQueue(gx, gy);
        } else if (gx === 0 || gx === GRID_COLS - 1 || gy === 0 || gy === GRID_ROWS - 1) {
          pushQueue(gx, gy);
        }
      }
    }

    while (qHead < qTail) {
      const cx = queueX[qHead];
      const cy = queueY[qHead];
      qHead++;

      if (cx > 0) pushQueue(cx - 1, cy);
      if (cx < GRID_COLS - 1) pushQueue(cx + 1, cy);
      if (cy > 0) pushQueue(cx, cy - 1);
      if (cy < GRID_ROWS - 1) pushQueue(cx, cy + 1);
    }

    let newlyCaptured = 0;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const idx = y * GRID_COLS + x;
        if (this.playableMask[idx] && !outside[idx]) {
          if (this.grid[idx] !== ownerId) {
            this.setCell(x, y, ownerId);
            newlyCaptured++;
          }
        }
      }
    }

    const totalOwned = this.cellCounts[ownerId] || 0;
    const pct = Math.min(100.0, (totalOwned / this.totalPlayableCells) * 100);

    return {
      captured: newlyCaptured,
      total: totalOwned,
      percent: pct.toFixed(2)
    };
  }

  isCellOwnedByPlayer(wx, wy) {
    const { gx, gy } = this.worldToGrid(wx, wy);
    return this.getCell(gx, gy) === 1;
  }
  getOwnerPercent(ownerId) {
    const count = this.cellCounts[ownerId] || 0;
    const pct = Math.min(100.0, (count / this.totalPlayableCells) * 100);
    return pct.toFixed(2);
  }

  // --- Render Circular Arena and Territories ---
  render(ctx, camera, playerOwnerId = 1, skinType = 'solid', entityColors = {}) {
    this.renderSmooth(ctx, camera, entityColors);
  }

  renderSmooth(ctx, camera, entityColors = {}) {
    if (!this.paths) {
      this.paths = new Map();
      const stride = GRID_COLS + 1;

      for (const owner of Object.keys(this.cellCounts).map(Number)) {
        const edges = new Map();
        const add = (x1, y1, x2, y2) => {
          const key = y1 * stride + x1;
          if (!edges.has(key)) edges.set(key, []);
          edges.get(key).push(y2 * stride + x2);
        };

        for (let y = 0; y < GRID_ROWS; y++) {
          for (let x = 0; x < GRID_COLS; x++) {
            if (this.getCell(x, y) !== owner) continue;
            if (this.getCell(x, y - 1) !== owner) add(x, y, x + 1, y);
            if (this.getCell(x + 1, y) !== owner) add(x + 1, y, x + 1, y + 1);
            if (this.getCell(x, y + 1) !== owner) add(x + 1, y + 1, x, y + 1);
            if (this.getCell(x - 1, y) !== owner) add(x, y + 1, x, y);
          }
        }

        const path = new Path2D();
        while (edges.size) {
          const start = edges.keys().next().value;
          const points = [];
          let key = start;
          let guard = 0;

          do {
            points.push({
              x: (key % stride) * CELL_SIZE,
              y: Math.floor(key / stride) * CELL_SIZE
            });
            const next = edges.get(key);
            if (!next || !next.length) break;
            const end = next.pop();
            if (!next.length) edges.delete(key);
            key = end;
            guard++;
          } while (key !== start && guard < TOTAL_GRID_CELLS);

          if (points.length < 3) continue;
          const last = points[points.length - 1];
          path.moveTo((last.x + points[0].x) / 2, (last.y + points[0].y) / 2);
          points.forEach((point, index) => {
            const next = points[(index + 1) % points.length];
            path.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
          });
          path.closePath();
        }
        this.paths.set(owner, path);
      }
    }

    ctx.save();
    ctx.translate(ctx.canvas.clientWidth / 2 - camera.x * camera.zoom, ctx.canvas.clientHeight / 2 - camera.y * camera.zoom);
    ctx.scale(camera.zoom, camera.zoom);
    for (const [owner, path] of this.paths) {
      ctx.fillStyle = entityColors[owner] || (owner === 1 ? '#00f0ff' : '#ff4757');
      ctx.fill(path, 'evenodd');
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2 / camera.zoom;
      ctx.stroke(path);
    }
    ctx.restore();
  }

  renderCells(ctx, camera, playerOwnerId = 1, skinType = 'solid', entityColors = {}) {
    const minWorldX = camera.x - (ctx.canvas.width / 2) / camera.zoom;
    const maxWorldX = camera.x + (ctx.canvas.width / 2) / camera.zoom;
    const minWorldY = camera.y - (ctx.canvas.height / 2) / camera.zoom;
    const maxWorldY = camera.y + (ctx.canvas.height / 2) / camera.zoom;

    const minGX = Math.max(0, Math.floor(minWorldX / CELL_SIZE));
    const maxGX = Math.min(GRID_COLS - 1, Math.ceil(maxWorldX / CELL_SIZE));
    const minGY = Math.max(0, Math.floor(minWorldY / CELL_SIZE));
    const maxGY = Math.min(GRID_ROWS - 1, Math.ceil(maxWorldY / CELL_SIZE));

    ctx.save();

    for (let gy = minGY; gy <= maxGY; gy++) {
      for (let gx = minGX; gx <= maxGX; gx++) {
        const idx = gy * GRID_COLS + gx;
        if (!this.playableMask[idx]) continue;

        const owner = this.grid[idx];
        if (owner === 0) continue;

        const wx = gx * CELL_SIZE;
        const wy = gy * CELL_SIZE;
        const sp = camera.worldToScreen(wx, wy);
        const wSize = CELL_SIZE * camera.zoom;

        const baseColor = entityColors[owner] || (owner === 1 ? '#00f0ff' : '#ff4757');

        ctx.fillStyle = baseColor;
        ctx.fillRect(sp.x, sp.y, wSize + 0.5, wSize + 0.5);

        const topSame = this.getCell(gx, gy - 1) === owner;
        const bottomSame = this.getCell(gx, gy + 1) === owner;
        const leftSame = this.getCell(gx - 1, gy) === owner;
        const rightSame = this.getCell(gx + 1, gy) === owner;

        if (!topSame || !bottomSame || !leftSame || !rightSame) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 2 * camera.zoom;
          ctx.beginPath();
          if (!topSame) { ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x + wSize, sp.y); }
          if (!bottomSame) { ctx.moveTo(sp.x, sp.y + wSize); ctx.lineTo(sp.x + wSize, sp.y + wSize); }
          if (!leftSame) { ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x, sp.y + wSize); }
          if (!rightSame) { ctx.moveTo(sp.x + wSize, sp.y); ctx.lineTo(sp.x + wSize, sp.y + wSize); }
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }
}
