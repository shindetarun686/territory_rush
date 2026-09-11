// src/game/particles.js

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  // --- Emit trail particles ---
  emitTrail(x, y, trailType, color = '#00f0ff') {
    const p = {
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: 3 + Math.random() * 4,
      color: color,
      alpha: 1,
      decay: 1.5 + Math.random() * 1.5,
      type: trailType || 'dot',
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 5
    };

    if (trailType === 'rainbow') {
      const hue = (Date.now() / 8) % 360;
      p.color = `hsl(${hue}, 100%, 60%)`;
    } else if (trailType === 'ember') {
      p.color = Math.random() > 0.5 ? '#ff4500' : '#ffaa00';
      p.vy -= 20;
    } else if (trailType === 'snow') {
      p.color = '#e0f2fe';
    } else if (trailType === 'gold') {
      p.color = Math.random() > 0.4 ? '#fbbf24' : '#fef08a';
    } else if (trailType === 'pixel') {
      p.size = 5;
    }

    this.particles.push(p);
  }

  // --- Emit Territory Capture Particles ---
  emitCaptureBorder(points, color = '#00f0ff') {
    const step = Math.max(1, Math.floor(points.length / 30));
    for (let i = 0; i < points.length; i += step) {
      const pt = points[i];
      for (let k = 0; k < 2; k++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 80;
        this.particles.push({
          x: pt.x,
          y: pt.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 3,
          color: color,
          alpha: 1,
          decay: 1.2 + Math.random() * 0.8,
          type: 'spark'
        });
      }
    }
  }

  // --- Emit Elimination Effect ---
  emitElimination(x, y, effectType = 'explosion', mainColor = '#ff0055') {
    let count = 45;
    let baseSpeed = 160;

    if (effectType === 'galaxy_implosion') {
      count = 80;
      baseSpeed = 220;
    } else if (effectType === 'neon_explosion') {
      count = 70;
    }

    // Expanding shockwave
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: 180,
      color: mainColor,
      alpha: 1,
      speed: 380,
      lineWidth: 6
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = baseSpeed * (0.3 + Math.random() * 0.9);
      let pColor = mainColor;

      if (effectType === 'lightning_burst') {
        pColor = Math.random() > 0.5 ? '#fde047' : '#38bdf8';
      } else if (effectType === 'fire_burst') {
        pColor = Math.random() > 0.5 ? '#ff4500' : '#fbbf24';
      } else if (effectType === 'ice_shatter') {
        pColor = Math.random() > 0.5 ? '#a5f3fc' : '#ffffff';
      } else if (effectType === 'star_burst') {
        pColor = ['#f43f5e', '#a855f7', '#38bdf8', '#fbbf24'][Math.floor(Math.random() * 4)];
      }

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: pColor,
        alpha: 1,
        decay: 0.8 + Math.random() * 1.2,
        type: effectType.includes('pixel') ? 'pixel' : (effectType.includes('ice') ? 'shard' : 'spark'),
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10
      });
    }
  }

  // --- Floating text labels ---
  addFloatingText(text, x, y, color = '#ffd700', size = 22, subtext = null) {
    this.floatingTexts.push({
      text,
      subtext,
      x,
      y,
      vy: -60,
      alpha: 1,
      size,
      color,
      decay: 0.65
    });
  }

  update(dt) {
    // Update regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.rot !== undefined) p.rot += (p.vrot || 0) * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy += 30 * dt; // slight friction
      ft.alpha -= ft.decay * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // Render shockwaves
    ctx.save();
    for (const sw of this.shockwaves) {
      const sp = camera.worldToScreen(sw.x, sw.y);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth * sw.alpha;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sw.radius * camera.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Render particles
    ctx.save();
    for (const p of this.particles) {
      const sp = camera.worldToScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === 'pixel' || p.type === 'shard') {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1, p.size * p.alpha), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Render floating texts in screen-space
    ctx.save();
    for (const ft of this.floatingTexts) {
      const sp = camera.worldToScreen(ft.x, ft.y);
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.font = `900 ${Math.floor(ft.size)}px "Outfit", "Segoe UI", sans-serif`;
      ctx.fillText(ft.text, sp.x, sp.y);

      if (ft.subtext) {
        ctx.font = `700 ${Math.floor(ft.size * 0.65)}px "Outfit", "Segoe UI", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.subtext, sp.x, sp.y + ft.size * 0.75);
      }
    }
    ctx.restore();
  }
}

export const particles = new ParticleSystem();
