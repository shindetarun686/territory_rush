// src/game/game.js
import { WorldGrid, WORLD_SIZE, ARENA_CENTER, ARENA_RADIUS, CELL_SIZE } from './world.js';
import { AIPlayer, AI_PERSONALITIES } from './ai.js';
import { particles } from './particles.js';
import { audio } from './audio.js';
import { storage } from './storage.js';

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

const TARGET_AI_COUNT = 7;

export const BOT_CONFIGS = [
  { name: 'matilda', color: '#ff7597', pillBg: '#ff7597' },
  { name: 'sophia', color: '#ff9f7f', pillBg: '#ff9f7f' },
  { name: 'xiu', color: '#f5b018', pillBg: '#f5b018' },
  { name: 'marcelo', color: '#38c172', pillBg: '#38c172' },
  { name: 'lucas', color: '#9b59b6', pillBg: '#9b59b6' },
  { name: 'alex', color: '#84cc16', pillBg: '#84cc16' },
  { name: 'elena', color: '#ec4899', pillBg: '#ec4899' },
  { name: 'david', color: '#06b6d4', pillBg: '#06b6d4' }
];

export class GameManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.world = new WorldGrid();
    this.state = GAME_STATES.MENU;
    this.mode = 'CLASSIC';

    // Camera
    this.camera = {
      x: ARENA_CENTER,
      y: ARENA_CENTER,
      zoom: 1.15,
      shake: 0,
      worldToScreen: (wx, wy) => {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        return {
          x: cx + (wx - this.camera.x) * this.camera.zoom,
          y: cy + (wy - this.camera.y) * this.camera.zoom
        };
      },
      screenToWorld: (sx, sy) => {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        return {
          wx: this.camera.x + (sx - cx) / this.camera.zoom,
          wy: this.camera.y + (sy - cy) / this.camera.zoom
        };
      }
    };

    this.timeScale = 1.0;
    this.slowMoTimer = 0;

    // Player state
    this.player = null;
    this.ais = [];
    this.nextAiId = 2;
    this.respawnQueue = [];

    // Match Metrics
    this.matchTimer = 0;
    this.score = 0;
    this.eliminations = 0;
    this.largestCapture = 0;
    this.territoryPercent = 0;
    this.bestPercent = storage.data.stats.maxTerritoryPercent || 0.4;
    this.rank = 1;

    // Steering input state
    this.mouseScreenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };

    this.initInputs();
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === GAME_STATES.PLAYING) this.pause();
        else if (this.state === GAME_STATES.PAUSED) this.resume();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreenPos = { x: e.clientX, y: e.clientY };
    });
  }

  setJoystickVector(vx, vy) {
    this.joystickVector = { x: vx, y: vy };
  }

  startMatch(speedMultiplier = 1.0) {
    this.state = GAME_STATES.PLAYING;
    this.world.reset();
    particles.reset();

    this.score = 0;
    this.eliminations = 0;
    this.matchTimer = 0;
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.respawnQueue = [];
    this.nextAiId = 2;
    this.bestPercent = Math.max(0.4, storage.data.stats.maxTerritoryPercent || 0.4);

    // Spawn player inside the circular arena
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 400 + Math.random() * 600;
    const startX = ARENA_CENTER + Math.cos(spawnAngle) * spawnDist;
    const startY = ARENA_CENTER + Math.sin(spawnAngle) * spawnDist;

    const baseSpeed = 240 * speedMultiplier;

    this.player = {
      id: 1,
      name: storage.data.playerName || 'Player',
      x: startX,
      y: startY,
      vx: baseSpeed,
      vy: 0,
      angle: 0,
      speed: baseSpeed,
      radius: 16,
      trail: [],
      isOutside: false,
      alive: true,
      skinId: storage.data.equipped.character || 'cyan_cube'
    };

    this.camera.x = this.player.x;
    this.camera.y = this.player.y;

    this.world.spawnInitialTerritory(1, startX, startY, 5);

    // Spawn initial AI Bots in circular arena
    this.ais = [];
    for (let i = 0; i < TARGET_AI_COUNT; i++) {
      this.spawnSingleAI();
    }

    audio.resume();
    audio.updateSettings();
    if (storage.data.settings.music) {
      audio.startCyberBgm();
    }
  }

  spawnSingleAI() {
    if (parseFloat(this.territoryPercent) >= 100.0) return;

    const cfg = BOT_CONFIGS[this.nextAiId % BOT_CONFIGS.length];
    const id = this.nextAiId++;

    let ax = ARENA_CENTER, ay = ARENA_CENTER;
    for (let attempt = 0; attempt < 10; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * (ARENA_RADIUS - 600);
      const rx = ARENA_CENTER + Math.cos(angle) * dist;
      const ry = ARENA_CENTER + Math.sin(angle) * dist;

      if (!this.player || Math.hypot(rx - this.player.x, ry - this.player.y) > 500) {
        if (this.world.isCellOwnedByPlayer(rx, ry)) { continue; }
        ax = rx;
        ay = ry;
        break;
      }
    }

    const ai = new AIPlayer({
      id,
      name: cfg.name,
      color: cfg.color,
      personality: AI_PERSONALITIES[id % AI_PERSONALITIES.length],
      x: ax,
      y: ay,
      speed: 200 + Math.random() * 30
    });
    ai.pillBg = cfg.pillBg;

    this.world.spawnInitialTerritory(ai.id, ax, ay, 5);
    this.ais.push(ai);
  }

  pause() {
    if (this.state === GAME_STATES.PLAYING) this.state = GAME_STATES.PAUSED;
  }

  resume() {
    if (this.state === GAME_STATES.PAUSED) this.state = GAME_STATES.PLAYING;
  }

  update(dt) {
    if (this.state === GAME_STATES.PAUSED) return;

    if (this.state === GAME_STATES.GAMEOVER || this.state === GAME_STATES.VICTORY) {
      particles.update(dt);
      if (this.camera.shake > 0) {
        this.camera.shake = Math.max(0, this.camera.shake - dt * 25);
      }
      return;
    }

    if (this.state !== GAME_STATES.PLAYING) return;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      this.timeScale = 0.35;
      if (this.slowMoTimer <= 0) this.timeScale = 1.0;
    } else {
      this.timeScale = 1.0;
    }

    const scaledDt = dt * this.timeScale;
    this.matchTimer += scaledDt;

    // Continuous AI Respawn Loop until 100% Conquered
    if (parseFloat(this.territoryPercent) < 100.0) {
      for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
        this.respawnQueue[i].timer -= scaledDt;
        if (this.respawnQueue[i].timer <= 0) {
          this.respawnQueue.splice(i, 1);
          this.spawnSingleAI();
        }
      }

      const aliveAIs = this.ais.filter(a => a.alive).length;
      if (aliveAIs + this.respawnQueue.length < TARGET_AI_COUNT) {
        this.respawnQueue.push({ timer: 2.0 + Math.random() * 1.5 });
      }
    }

    if (this.player.alive) {
      this.updatePlayerMovement(scaledDt);
      this.updatePlayerTerritory();
    }

    for (const ai of this.ais) {
      if (ai.alive) {
        ai.update(scaledDt, this.world, this.player, this.ais);
        this.updateAITerritory(ai);
      }
    }

    this.checkCombatCollisions();
    particles.update(scaledDt);

    if (this.player.alive) {
      this.camera.x += (this.player.x - this.camera.x) * 0.16;
      this.camera.y += (this.player.y - this.camera.y) * 0.16;
    }

    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - scaledDt * 25);
    }

    this.updateLeaderboard();
    this.checkVictoryCondition();
  }

  updatePlayerMovement(dt) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const mouseDx = this.mouseScreenPos.x - cx;
    const mouseDy = this.mouseScreenPos.y - cy;
    const mouseDist = Math.hypot(mouseDx, mouseDy);

    let targetAngle = this.player.angle;

    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      targetAngle = Math.atan2(this.joystickVector.y, this.joystickVector.x);
    } else if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['KeyS'] || this.keys['ArrowDown']) {
      let kx = 0, ky = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) ky -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) ky += 1;
      if (kx !== 0 || ky !== 0) targetAngle = Math.atan2(ky, kx);
    } else if (mouseDist > 15) {
      targetAngle = Math.atan2(mouseDy, mouseDx);
    }

    let diff = targetAngle - this.player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.player.angle += diff * Math.min(1.0, 14 * dt);

    this.player.vx = Math.cos(this.player.angle) * this.player.speed;
    this.player.vy = Math.sin(this.player.angle) * this.player.speed;

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // --- Circular Arena Boundary Constraint ---
    const distFromCenter = Math.hypot(this.player.x - ARENA_CENTER, this.player.y - ARENA_CENTER);
    const maxRadius = ARENA_RADIUS - 18;

    if (distFromCenter > maxRadius) {
      const angle = Math.atan2(this.player.y - ARENA_CENTER, this.player.x - ARENA_CENTER);
      this.player.x = ARENA_CENTER + Math.cos(angle) * maxRadius;
      this.player.y = ARENA_CENTER + Math.sin(angle) * maxRadius;
    }
  }

  updatePlayerTerritory() {
    const { gx, gy } = this.world.worldToGrid(this.player.x, this.player.y);
    const cellOwner = this.world.getCell(gx, gy);
    const wasOutside = this.player.isOutside;
    this.player.isOutside = (cellOwner !== this.player.id);

    if (!wasOutside && this.player.isOutside) {
      this.player.trail = [{ x: this.player.x, y: this.player.y }];
    } else if (this.player.isOutside) {
      const last = this.player.trail[this.player.trail.length - 1];
      if (!last || Math.hypot(this.player.x - last.x, this.player.y - last.y) > 10) {
        for (let i = 0; i < this.player.trail.length - 10; i++) {
          const pt = this.player.trail[i];
          if (Math.hypot(this.player.x - pt.x, this.player.y - pt.y) < 12) {
            this.eliminatePlayer('Self-Collided into own trail!');
            return;
          }
        }
        this.player.trail.push({ x: this.player.x, y: this.player.y });
      }
    } else if (wasOutside && !this.player.isOutside) {
      this.player.trail.push({ x: this.player.x, y: this.player.y });
      const res = this.world.captureTerritory(this.player.id, this.player.trail);

      if (res.captured > 0) {
        const basePoints = res.captured * 10;
        this.score += basePoints;

        particles.emitCaptureBorder(this.player.trail, '#00f0ff');
        particles.addFloatingText(`+${res.percent}%`, this.player.x, this.player.y - 30, '#00f0ff', 24);

        if (res.captured > 200) audio.playBigCapture();
        else audio.playCapture(Math.min(1, res.captured / 150));

        storage.updateStat('totalCapturedCells', res.captured);
        storage.updateStat('largestSingleCapture', res.captured, true);
        storage.updateStat('highestScore', this.score, true);
        storage.addCoins(Math.floor(res.captured * 0.2));
        storage.addXp(Math.floor(res.captured * 0.5));
      }

      this.player.trail = [];
    }
  }

  updateAITerritory(ai) {
    const { gx, gy } = this.world.worldToGrid(ai.x, ai.y);
    const cellOwner = this.world.getCell(gx, gy);

    if (ai.trail.length > 2 && cellOwner === ai.id) {
      ai.trail.push({ x: ai.x, y: ai.y });
      const res = this.world.captureTerritory(ai.id, ai.trail);
      if (res.captured > 0) {
        ai.score += res.captured * 10;
        particles.emitCaptureBorder(ai.trail, ai.color);
      }
      ai.trail = [];
      ai.isOutside = false;
      ai.state = 'wander';
    }
  }

  checkCombatCollisions() {
    const allEntities = [this.player, ...this.ais].filter(e => e.alive);

    for (const attacker of allEntities) {
      for (const victim of allEntities) {
        if (attacker.id === victim.id) continue;
        if (!victim.isOutside || victim.trail.length < 2) continue;

        for (let i = 0; i < victim.trail.length - 2; i++) {
          const pt = victim.trail[i];
          const dist = Math.hypot(attacker.x - pt.x, attacker.y - pt.y);

          if (dist < attacker.radius + 8) {
            this.handleElimination(attacker, victim);
            break;
          }
        }
      }
    }
  }

  handleElimination(attacker, victim) {
    victim.alive = false;
    this.world.clearOwner(victim.id);
    particles.emitElimination(victim.x, victim.y, 'explosion', victim.color || '#ff4757');

    if (attacker.id === 1) {
      this.eliminations += 1;
      this.score += 1000;
      particles.addFloatingText(`+1,000 ELIMINATED`, victim.x, victim.y - 30, '#ef4444', 26);
      audio.playElimination();
      this.camera.shake = 10;
      this.slowMoTimer = 0.35;
      storage.updateStat('totalEliminations', 1);
      storage.updateStat('highestScore', this.score, true);
      storage.addCoins(100);
      storage.addXp(250);

      this.respawnQueue.push({ timer: 2.5 });
    } else if (victim.id === 1) {
      this.eliminatePlayer(`Eliminated by ${attacker.name}!`);
    } else {
      attacker.kills = (attacker.kills || 0) + 1;
      attacker.score += 800;
      this.respawnQueue.push({ timer: 3.0 });
    }
  }

  eliminatePlayer(reason = 'Eliminated!') {
    this.player.alive = false;
    this.world.clearOwner(this.player.id);
    this.state = GAME_STATES.GAMEOVER;
    this.camera.shake = 14;
    audio.playPlayerDied();
    particles.emitElimination(this.player.x, this.player.y, 'explosion', '#ef4444');
    this.recordMatchResults(false, reason);
  }

  checkVictoryCondition() {
    if (parseFloat(this.territoryPercent) >= 100.0) {
      this.triggerVictory('100% ARENA CONQUERED! ULTIMATE VICTORY');
    }
  }

  triggerVictory(reason = '100% DOMINATION!') {
    this.state = GAME_STATES.VICTORY;
    audio.playVictory();
    this.recordMatchResults(true, reason);

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const rx = this.player.x + (Math.random() - 0.5) * 500;
        const ry = this.player.y + (Math.random() - 0.5) * 500;
        particles.emitElimination(rx, ry, 'explosion', '#ffd700');
      }, i * 200);
    }
  }

  recordMatchResults(won, reason) {
    storage.updateStat('matchesPlayed', 1);
    if (won) storage.updateStat('matchesWon', 1);
    storage.updateStat('maxTerritoryPercent', parseFloat(this.territoryPercent), true);
    storage.updateStat('highestScore', this.score, true);

    const coinsEarned = Math.floor(this.score * 0.05) + (won ? 1000 : 100);
    const xpEarned = Math.floor(this.score * 0.1) + (won ? 1500 : 200);

    storage.addCoins(coinsEarned);
    const levelRes = storage.addXp(xpEarned);

    this.matchSummary = {
      won,
      reason,
      score: this.score,
      territory: this.territoryPercent,
      rank: this.rank,
      eliminations: this.eliminations,
      coinsEarned,
      xpEarned,
      levelRes
    };
  }

  updateLeaderboard() {
    const list = [];
    if (this.player.alive) {
      const pct = parseFloat(this.world.getOwnerPercent(this.player.id));
      this.territoryPercent = pct.toFixed(2);
      if (pct > this.bestPercent) this.bestPercent = pct;
      list.push({ id: 1, name: this.player.name, percent: pct, score: this.score, isPlayer: true, pillBg: '#06b6d4' });
    }
    for (const ai of this.ais) {
      if (ai.alive) {
        const pct = parseFloat(this.world.getOwnerPercent(ai.id));
        ai.territoryPercent = pct.toFixed(2);
        list.push({ id: ai.id, name: ai.name, percent: pct, score: ai.score, isPlayer: false, pillBg: ai.pillBg || ai.color });
      }
    }

    list.sort((a, b) => b.percent - a.percent || b.score - a.score);
    this.leaderboard = list;

    const pIdx = list.findIndex(e => e.isPlayer);
    this.rank = (pIdx !== -1) ? (pIdx + 1) : '-';
  }

  render() {
    const { width, height } = this.canvas;

    this.ctx.save();
    if (this.camera.shake > 0) {
      const sx = (Math.random() - 0.5) * this.camera.shake;
      const sy = (Math.random() - 0.5) * this.camera.shake;
      this.ctx.translate(sx, sy);
    }

    // 1. Soft clean light blue paper background inside the disk
    this.ctx.fillStyle = '#22383e'; // Outer boundary void background
    this.ctx.fillRect(0, 0, width, height);

    // Draw Circular Arena Playable Disk
    const spCenter = this.camera.worldToScreen(ARENA_CENTER, ARENA_CENTER);
    const screenRadius = ARENA_RADIUS * this.camera.zoom;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(spCenter.x, spCenter.y, screenRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#e4f1fb'; // Light paper arena disk
    this.ctx.fill();
    this.ctx.clip(); // Clip all territory rendering inside circular arena

    // 2. Render Captured Territories
    const entityColors = { 1: '#00f0ff' };
    this.ais.forEach(ai => { entityColors[ai.id] = ai.color; });
    this.world.render(this.ctx, this.camera, 1, 'solid', entityColors);

    this.ctx.restore(); // Restore clip

    // 3. Render Circular Arena Perimeter Border Ring
    this.renderArenaBorders(spCenter, screenRadius);

    // 4. Render AI entities & exposed trails
    for (const ai of this.ais) {
      ai.render(this.ctx, this.camera);
    }

    // 5. Render Player 3D Paint Roller & Cyan Ribbon Trail
    if (this.player && this.player.alive) {
      this.renderPlayer();
    }

    // 6. Render Particles & Floating Damage/Score Text
    particles.render(this.ctx, this.camera);

    this.ctx.restore();
  }

  // Draw Smooth Circular Arena Border
  renderArenaBorders(spCenter, screenRadius) {
    this.ctx.save();
    this.ctx.strokeStyle = '#386167';
    this.ctx.lineWidth = 14 * this.camera.zoom;
    this.ctx.beginPath();
    this.ctx.arc(spCenter.x, spCenter.y, screenRadius + 4 * this.camera.zoom, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4 * this.camera.zoom;
    this.ctx.beginPath();
    this.ctx.arc(spCenter.x, spCenter.y, screenRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderPlayer() {
    const sp = this.camera.worldToScreen(this.player.x, this.player.y);

    // 1. Draw Cyan Paint Ribbon Trail
    if (this.player.isOutside && this.player.trail.length > 1) {
      this.ctx.save();
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 26 * this.camera.zoom;
      this.ctx.lineCap = 'square';
      this.ctx.lineJoin = 'miter';
      this.ctx.beginPath();
      const p0 = this.camera.worldToScreen(this.player.trail[0].x, this.player.trail[0].y);
      this.ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < this.player.trail.length; i++) {
        const pi = this.camera.worldToScreen(this.player.trail[i].x, this.player.trail[i].y);
        this.ctx.lineTo(pi.x, pi.y);
      }
      this.ctx.lineTo(sp.x, sp.y);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 2. Draw 3D Paint Roller Body
    this.ctx.save();
    this.ctx.translate(sp.x, sp.y);
    this.ctx.rotate(this.player.angle);

    const zoom = this.camera.zoom;

    // Metal Arm
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 3.5 * zoom;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -12 * zoom);
    this.ctx.lineTo(-14 * zoom, -12 * zoom);
    this.ctx.lineTo(-14 * zoom, 0);
    this.ctx.lineTo(-24 * zoom, 0);
    this.ctx.stroke();

    // Wooden Handle
    this.ctx.fillStyle = '#b08968';
    this.ctx.fillRect(-34 * zoom, -3.5 * zoom, 12 * zoom, 7 * zoom);

    // Roller Cylinder
    const rW = 16 * zoom;
    const rH = 26 * zoom;

    this.ctx.fillStyle = '#00e5ff';
    this.ctx.fillRect(-rW / 2, -rH / 2, rW, rH);

    this.ctx.fillStyle = '#67e8f9';
    this.ctx.fillRect(-rW / 2, -rH / 2, rW, 4 * zoom);

    this.ctx.fillStyle = '#0891b2';
    this.ctx.fillRect(rW / 2 - 3 * zoom, -rH / 2, 3 * zoom, rH);

    this.ctx.restore();
  }
}
