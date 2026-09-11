// src/game/engine.js
/**
 * Game Engine – handles main loop, state transitions, and entity updates.
 * It is instantiated by src/main.js with the rendering context, canvas, and input.
 */
export function initEngine({ ctx, canvas, input }) {
  // Game constants
  const PLAYER_SPEED = 300; // pixels per second (will be scaled by camera)
  const WORLD_SIZE = 5000; // square world dimensions (world wraps)

  // Simple camera that follows the player with lerp
  const camera = {
    x: 0,
    y: 0,
    lerpFactor: 0.1,
    update(targetX, targetY) {
      this.x += (targetX - this.x) * this.lerpFactor;
      this.y += (targetY - this.y) * this.lerpFactor;
    },
    worldToScreen(wx, wy) {
      return {
        x: wx - this.x + canvas.width / 2,
        y: wy - this.y + canvas.height / 2,
      };
    },
  };

  // Player entity (basic version for now)
  const player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    radius: 12,
    color: '#00ffcc',
    // Holds the current trail points when outside own territory
    trail: [],
    // Simple state machine – 'idle' inside territory, 'trailing' when outside
    state: 'idle',
    update(dt) {
      const dir = input.getDirection();
      if (dir.x !== 0 || dir.y !== 0) {
        this.x += dir.x * PLAYER_SPEED * dt;
        this.y += dir.y * PLAYER_SPEED * dt;
        // Wrap world edges
        this.x = (this.x + WORLD_SIZE) % WORLD_SIZE;
        this.y = (this.y + WORLD_SIZE) % WORLD_SIZE;
        // Trail handling – for demo we always record points when moving
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 200) this.trail.shift(); // keep short for demo
        this.state = 'trailing';
      } else {
        this.state = 'idle';
      }
    },
    render() {
      const screenPos = camera.worldToScreen(this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    },
    renderTrail() {
      if (this.trail.length < 2) return;
      ctx.strokeStyle = 'rgba(0,255,200,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const start = camera.worldToScreen(this.trail[0].x, this.trail[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < this.trail.length; i++) {
        const p = camera.worldToScreen(this.trail[i].x, this.trail[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    },
  };

  // Simple background grid renderer
  function drawGrid() {
    const gridSize = 100; // world units per grid line
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical lines
    for (let gx = 0; gx <= WORLD_SIZE; gx += gridSize) {
      const p1 = camera.worldToScreen(gx, 0);
      const p2 = camera.worldToScreen(gx, WORLD_SIZE);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    // horizontal lines
    for (let gy = 0; gy <= WORLD_SIZE; gy += gridSize) {
      const p1 = camera.worldToScreen(0, gy);
      const p2 = camera.worldToScreen(WORLD_SIZE, gy);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }

  // ---- AI SECTION ----
  const ais = [];

  // Dynamically import AI modules and create instances
  async function createAIs() {
    const { Aggressor } = await import('./ai/aggressor.js');
    for (let i = 0; i < 3; i++) {
      const ai = new Aggressor({
        id: `ai${i}`,
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        color: ['#ff5555', '#55ff55', '#5555ff'][i],
        speed: 200 + Math.random() * 100,
        target: player,
      });
      ais.push(ai);
    }
  }
  createAIs();

  return {
    update(dt) {
      player.update(dt);
      for (const ai of ais) {
        ai.update(dt, WORLD_SIZE);
      }
      camera.update(player.x, player.y);
    },
    render() {
      // Clear screen
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid();

      // Render AI trails first
      for (const ai of ais) {
        ai.renderTrail(ctx, camera);
      }

      // Render player trail if active
      if (player.state === 'trailing') player.renderTrail();

      // Render AI bodies
      for (const ai of ais) {
        ai.render(ctx, camera);
      }

      // Render player on top
      player.render();
    },
  };
}
