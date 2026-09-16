// src/ui/ui.js
import { storage } from '../game/storage.js';
import { audio } from '../game/audio.js';
import { GAME_STATES } from '../game/game.js';
import { drawIsoBlock } from '../game/isoRenderer.js';
import { ARENA_RADIUS, ARENA_CENTER, CELL_SIZE, GRID_COLS, GRID_ROWS } from '../game/world.js';


export const SCORE_SKINS = [
  { id: 'cyan_cube', name: 'Blue Cube', scoreRequired: 0, desc: 'Default Starter Skin', skinId: 'cyan_cube' },
  { id: 'cake', name: 'Strawberry Cake', scoreRequired: 2000, desc: 'Score 2,000 Points', skinId: 'cake' },
  { id: 'rhino', name: 'Rhinoceros', scoreRequired: 5000, desc: 'Score 5,000 Points', skinId: 'rhino' },
  { id: 'mouse', name: 'Origami Mouse', scoreRequired: 10000, desc: 'Score 10,000 Points', skinId: 'mouse' },
  { id: 'gold', name: 'Royal Gold', scoreRequired: 25000, desc: 'Score 25,000 Points', skinId: 'gold' }
];

export class UIManager {
  constructor(game) {
    this.game = game;
    this.selectedCarouselIndex = 0;
    this.previewAngle = 0;
    this.selectedMode = 'CLASSIC';
    this.tipHideAt = 0;

    this.initElements();
    this.bindEvents();
    this.startMenu3DAnimation();
  }

  initElements() {
    this.hud = document.getElementById('hud');
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.id = 'miniMapCanvas';
    this.minimapCanvas.className = 'mini-map';
    this.hud.appendChild(this.minimapCanvas);
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.hudTerritory = document.getElementById('hudTerritory');
    this.hudTerritoryFill = document.getElementById('hudTerritoryFill');
    this.hudBest = document.getElementById('hudBest');
    this.hudKills = document.getElementById('hudKills');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.hudCenterTip = document.getElementById('hudCenterTip');

    this.mainMenuScreen = document.getElementById('mainMenuScreen');
    this.skinSelectionScreen = document.getElementById('skinSelectionScreen');
    this.skinCarousel = document.getElementById('skinCarousel');
    this.pauseModal = document.getElementById('pauseModal');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.victoryModal = document.getElementById('victoryModal');

    this.dashCoins = document.getElementById('dashCoins');
    this.dashLevel = document.getElementById('dashLevel');

    this.menuPreviewCanvas = document.getElementById('menuPreviewCanvas');
    this.previewCtx = this.menuPreviewCanvas.getContext('2d');
    this.playerPseudoInput = document.getElementById('playerPseudoInput');

    if (storage.data.playerName) {
      this.playerPseudoInput.value = storage.data.playerName;
    }

    this.updateDashboardHeader();
  }

  bindEvents() {
    // Mode Chips
    document.querySelectorAll('.mode-chip').forEach(chip => {
      chip.onclick = () => {
        audio.playClick();
        document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedMode = chip.getAttribute('data-mode') || 'CLASSIC';
      };
    });

    const btnPlay = document.getElementById('btnMenuPlay');
    if (btnPlay) {
      btnPlay.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        this.savePlayerName();
        this.startGame(1.0);
      };
    }

    const btnBooster = document.getElementById('btnStartBooster');
    if (btnBooster) {
      btnBooster.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        this.savePlayerName();
        this.startGame(1.4);
      };
    }

    const btnSkins = document.getElementById('btnOpenSkins');
    if (btnSkins) {
      btnSkins.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        this.openSkinCarousel();
      };
    }

    const btnSkinBack = document.getElementById('btnSkinBack');
    if (btnSkinBack) {
      btnSkinBack.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        this.skinSelectionScreen.style.display = 'none';
        this.skinSelectionScreen.classList.add('hidden');
        this.mainMenuScreen.style.display = 'flex';
        this.mainMenuScreen.classList.remove('hidden');
      };
    }

    const btnSkinSelect = document.getElementById('btnSkinSelect');
    if (btnSkinSelect) {
      btnSkinSelect.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        const chosen = SCORE_SKINS[this.selectedCarouselIndex];
        const highScore = storage.data.stats.highestScore || 0;

        if (highScore >= chosen.scoreRequired) {
          storage.unlockItem('character', chosen.skinId);
          storage.equipItem('character', chosen.skinId);
          this.skinSelectionScreen.style.display = 'none';
          this.skinSelectionScreen.classList.add('hidden');
          this.mainMenuScreen.style.display = 'flex';
          this.mainMenuScreen.classList.remove('hidden');
        } else {
          alert(`Reach ${chosen.scoreRequired.toLocaleString()} points to unlock ${chosen.name}!`);
        }
      };
    }

    const btnPause = document.getElementById('btnPause');
    if (btnPause) {
      btnPause.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        this.game.pause();
        this.pauseModal.style.display = 'flex';
        this.pauseModal.classList.remove('hidden');
      };
    }

    const btnAudio = document.getElementById('btnAudioToggle');
    if (btnAudio) {
      btnAudio.onclick = (e) => {
        e.preventDefault();
        audio.playClick();
        storage.data.settings.sfx = !storage.data.settings.sfx;
        storage.data.settings.music = storage.data.settings.sfx;
        storage.save();
        audio.updateSettings();
        btnAudio.innerText = storage.data.settings.sfx ? '🔊' : '🔇';
      };
    }

    const btnResume = document.getElementById('btnResume');
    if (btnResume) {
      btnResume.onclick = () => {
        audio.playClick();
        this.pauseModal.style.display = 'none';
        this.pauseModal.classList.add('hidden');
        this.game.resume();
      };
    }

    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) {
      btnRestart.onclick = () => {
        audio.playClick();
        this.pauseModal.style.display = 'none';
        this.pauseModal.classList.add('hidden');
        this.startGame(1.0);
      };
    }

    const btnPauseExit = document.getElementById('btnPauseExit');
    if (btnPauseExit) {
      btnPauseExit.onclick = () => {
        audio.playClick();
        this.pauseModal.style.display = 'none';
        this.pauseModal.classList.add('hidden');
        this.exitToMainMenu();
      };
    }

    const btnGoPlayAgain = document.getElementById('btnGoPlayAgain');
    if (btnGoPlayAgain) {
      btnGoPlayAgain.onclick = () => {
        audio.playClick();
        this.gameOverModal.style.display = 'none';
        this.gameOverModal.classList.add('hidden');
        this.startGame(1.0);
      };
    }

    const btnGoMenu = document.getElementById('btnGoMenu');
    if (btnGoMenu) {
      btnGoMenu.onclick = () => {
        audio.playClick();
        this.gameOverModal.style.display = 'none';
        this.gameOverModal.classList.add('hidden');
        this.exitToMainMenu();
      };
    }

    const btnVicPlayAgain = document.getElementById('btnVicPlayAgain');
    if (btnVicPlayAgain) {
      btnVicPlayAgain.onclick = () => {
        audio.playClick();
        this.victoryModal.style.display = 'none';
        this.victoryModal.classList.add('hidden');
        this.startGame(1.0);
      };
    }

    const btnVicMenu = document.getElementById('btnVicMenu');
    if (btnVicMenu) {
      btnVicMenu.onclick = () => {
        audio.playClick();
        this.victoryModal.style.display = 'none';
        this.victoryModal.classList.add('hidden');
        this.exitToMainMenu();
      };
    }

    if (this.playerPseudoInput) {
      this.playerPseudoInput.onchange = () => {
        this.savePlayerName();
      };
    }

    this.bindVirtualJoystick();
  }

  bindVirtualJoystick() {
    const joystick = document.getElementById('virtualJoystick');
    const knob = document.getElementById('joystickKnob');
    if (!joystick || !knob) return;

    const updateVisibility = () => {
      joystick.style.display = window.matchMedia('(pointer: coarse), (max-width: 768px)').matches ? 'block' : 'none';
    };
    updateVisibility();
    window.addEventListener('resize', updateVisibility);

    let activePointerId = null;
    const max = 42;

    const setVector = (clientX, clientY) => {
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(max, len);
      const nx = dx / len;
      const ny = dy / len;
      knob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;
      this.game.setJoystickVector(nx * Math.min(1, len / max), ny * Math.min(1, len / max));
    };

    const reset = () => {
      activePointerId = null;
      knob.style.transform = 'translate(0, 0)';
      this.game.setJoystickVector(0, 0);
    };

    joystick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activePointerId = e.pointerId;
      joystick.setPointerCapture(e.pointerId);
      setVector(e.clientX, e.clientY);
    });
    joystick.addEventListener('pointermove', (e) => {
      if (e.pointerId === activePointerId) {
        e.preventDefault();
        setVector(e.clientX, e.clientY);
      }
    });
    joystick.addEventListener('pointerup', reset);
    joystick.addEventListener('pointercancel', reset);

    if (this.playerPseudoInput) {
      this.playerPseudoInput.addEventListener('input', () => this.savePlayerName());
      this.playerPseudoInput.addEventListener('change', () => this.savePlayerName());
    }
  }

  updateDashboardHeader() {
    if (this.dashCoins) this.dashCoins.innerText = storage.data.coins || 0;
    if (this.dashLevel) this.dashLevel.innerText = storage.data.level || 1;
  }

  savePlayerName() {
    if (!this.playerPseudoInput) return;
    const val = this.playerPseudoInput.value.trim() || 'Player';
    storage.data.playerName = val;
    storage.save();
    if (this.game && this.game.player) {
      this.game.player.name = val;
    }
  }

  startGame(speedMultiplier = 1.0) {
    this.mainMenuScreen.style.display = 'none';
    this.mainMenuScreen.classList.add('hidden');
    this.skinSelectionScreen.style.display = 'none';
    this.skinSelectionScreen.classList.add('hidden');
    this.pauseModal.style.display = 'none';
    this.pauseModal.classList.add('hidden');
    this.gameOverModal.style.display = 'none';
    this.gameOverModal.classList.add('hidden');
    if (this.victoryModal) {
      this.victoryModal.style.display = 'none';
      this.victoryModal.classList.add('hidden');
    }

    this.hud.style.display = 'flex';
    if (this.hudCenterTip) {
      this.tipHideAt = performance.now() + 5000;
      this.hudCenterTip.classList.remove('tip-hidden');
    }
    this.game.startMatch(speedMultiplier);
  }

  exitToMainMenu() {
    this.game.state = GAME_STATES.MENU;
    this.hud.style.display = 'none';
    this.gameOverModal.style.display = 'none';
    this.gameOverModal.classList.add('hidden');
    if (this.victoryModal) {
      this.victoryModal.style.display = 'none';
      this.victoryModal.classList.add('hidden');
    }
    this.pauseModal.style.display = 'none';
    this.pauseModal.classList.add('hidden');
    this.skinSelectionScreen.style.display = 'none';
    this.skinSelectionScreen.classList.add('hidden');

    this.updateDashboardHeader();
    this.mainMenuScreen.style.display = 'flex';
    this.mainMenuScreen.classList.remove('hidden');
  }

  startMenu3DAnimation() {
    const animate = () => {
      if (this.game.state === GAME_STATES.MENU && !this.mainMenuScreen.classList.contains('hidden') && this.mainMenuScreen.style.display !== 'none') {
        this.previewAngle += 0.025;
        this.previewCtx.clearRect(0, 0, 260, 260);

        const ctx = this.previewCtx;
        ctx.save();
        ctx.translate(130, 132);

        const pulse = 0.5 + Math.sin(this.previewAngle * 2) * 0.5;

        const floorGradient = ctx.createRadialGradient(0, 54, 8, 0, 54, 105);
        floorGradient.addColorStop(0, 'rgba(34, 211, 238, 0.42)');
        floorGradient.addColorStop(0.48, 'rgba(168, 85, 247, 0.18)');
        floorGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = floorGradient;
        ctx.beginPath();
        ctx.ellipse(0, 54, 106, 34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const radiusX = 58 + i * 16 + pulse * 5;
          const radiusY = 18 + i * 6 + pulse * 2;
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(34, 211, 238, 0.42)' : 'rgba(236, 72, 153, 0.34)';
          ctx.beginPath();
          ctx.ellipse(0, 54, radiusX, radiusY, this.previewAngle * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(148, 244, 255, 0.26)';
        ctx.lineWidth = 1;
        for (let x = -96; x <= 96; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, -92);
          ctx.lineTo(x * 0.46, 68);
          ctx.stroke();
        }
        for (let y = -72; y <= 54; y += 18) {
          ctx.beginPath();
          ctx.moveTo(-100, y);
          ctx.lineTo(100, y);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -6, 78 + pulse * 4, -0.25, Math.PI * 1.25);
        ctx.stroke();

        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#67e8f9';
        for (let y = 16; y < 248; y += 10) {
          ctx.fillRect(36, y, 188, 1);
        }
        ctx.restore();

        const chosenSkin = storage.data.equipped.character || 'cyan_cube';
        drawIsoBlock(ctx, 130, 112, 58, this.previewAngle, chosenSkin);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  openSkinCarousel() {
    this.mainMenuScreen.style.display = 'none';
    this.mainMenuScreen.classList.add('hidden');
    this.skinSelectionScreen.style.display = 'flex';
    this.skinSelectionScreen.classList.remove('hidden');
    this.renderSkinCarousel();
  }

  renderSkinCarousel() {
    this.skinCarousel.innerHTML = '';
    const currentHighScore = Math.max(storage.data.stats.highestScore || 0, this.game.score || 0);

    SCORE_SKINS.forEach((skin, idx) => {
      const isSelected = (idx === this.selectedCarouselIndex);
      const isUnlocked = (currentHighScore >= skin.scoreRequired);
      const item = document.createElement('div');
      item.className = `carousel-item ${isSelected ? 'active' : ''}`;

      const pct = skin.scoreRequired === 0 ? 100 : Math.min(100, Math.floor((currentHighScore / skin.scoreRequired) * 100));
      const progressLabel = isUnlocked ? 'UNLOCKED' : `${currentHighScore.toLocaleString()} / ${skin.scoreRequired.toLocaleString()} pts`;

      item.innerHTML = `
        <div class="skin-condition-title">${skin.desc}</div>
        <div class="skin-3d-box">
          <canvas width="120" height="120"></canvas>
        </div>
        <div>
          <div class="skin-progress-bar">
            <div class="skin-progress-fill" style="width: ${pct}%; background: ${isUnlocked ? '#2ecc71' : '#f5b018'};"></div>
          </div>
          <div class="skin-progress-label" style="color: ${isUnlocked ? '#2ecc71' : '#f5b018'};">${progressLabel}</div>
        </div>
      `;

      const canvas = item.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      drawIsoBlock(ctx, 60, 65, 42, 0, skin.skinId);

      item.onclick = () => {
        audio.playClick();
        this.selectedCarouselIndex = idx;
        this.renderSkinCarousel();
      };

      this.skinCarousel.appendChild(item);
    });
  }

  updateHUD() {
    if (this.game.state === GAME_STATES.GAMEOVER) {
      if (this.gameOverModal.classList.contains('hidden') || this.gameOverModal.style.display === 'none') {
        this.showGameOverScreen();
      }
      return;
    }

    if (this.game.state === GAME_STATES.VICTORY) {
      if (this.victoryModal && (this.victoryModal.classList.contains('hidden') || this.victoryModal.style.display === 'none')) {
        this.showVictoryScreen();
      }
      return;
    }

    if (this.game.state !== GAME_STATES.PLAYING && this.game.state !== GAME_STATES.PAUSED) return;

    this.hudTerritory.innerText = `${this.game.territoryPercent}%`;
    this.hudTerritoryFill.style.width = `${Math.min(100, parseFloat(this.game.territoryPercent))}%`;
    this.hudBest.innerText = `Best ${this.game.bestPercent}%`;
    this.hudKills.innerText = `x${this.game.eliminations}`;

    if (this.hudCenterTip && performance.now() >= this.tipHideAt) {
      this.hudCenterTip.classList.add('tip-hidden');
    }

    if (this.game.leaderboard) {
      this.leaderboardList.innerHTML = '';
      this.game.leaderboard.slice(0, 4).forEach((item, idx) => {
        const pill = document.createElement('div');
        pill.className = `lb-pill ${item.isPlayer ? 'player-pill' : ''}`;
        pill.style.background = item.pillBg || '#2f4e53';
        pill.innerHTML = `
          <div class="lb-rank">${idx + 1}</div>
          <span>${item.percent}% ${item.name}</span>
        `;
        this.leaderboardList.appendChild(pill);
      });

      const pIdx = this.game.leaderboard.findIndex(e => e.isPlayer);
      if (pIdx >= 4) {
        const pItem = this.game.leaderboard[pIdx];
        const pPill = document.createElement('div');
        pPill.className = 'lb-pill player-pill';
        pPill.style.background = '#06b6d4';
        pPill.innerHTML = `
          <div class="lb-rank">${pIdx + 1}</div>
          <span>${pItem.percent}% ${pItem.name} (You)</span>
        `;
        this.leaderboardList.appendChild(pPill);
      }
    }
    this.updateMiniMap(this.game);
  }

  // Render minimap showing owned territory and AI positions
  updateMiniMap(game) {
    const canvas = this.minimapCanvas;
    const ctx = this.minimapCtx;
    const displaySize = Math.round(canvas.getBoundingClientRect().width || 150);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = displaySize;
    ctx.clearRect(0, 0, size, size);

    // Scale world coordinates to minimap
    const scale = size / (ARENA_RADIUS * 2);
    const offset = ARENA_RADIUS;

    // Draw owned territory (player id = 1)
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const idx = y * GRID_COLS + x;
        if (game.world.grid[idx] === 1) {
          const wx = x * CELL_SIZE - offset;
          const wy = y * CELL_SIZE - offset;
          const sx = (wx + offset) * scale;
          const sy = (wy + offset) * scale;
          ctx.fillRect(sx, sy, CELL_SIZE * scale, CELL_SIZE * scale);
        }
      }
    }

    // Draw AI entities
    for (const ai of game.ais) {
      if (!ai.alive) continue;
      const sx = (ai.x + offset) * scale;
      const sy = (ai.y + offset) * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = ai.color;
      ctx.fill();
    }
  }

  showGameOverScreen() {
    const s = this.game.matchSummary || {
      reason: 'Trail was cut by an opponent.',
      score: this.game.score || 0,
      territory: this.game.territoryPercent || '0.00',
      rank: this.game.rank || 1,
      eliminations: this.game.eliminations || 0
    };

    document.getElementById('gameOverReason').innerText = s.reason;
    document.getElementById('goScore').innerText = (s.score || 0).toLocaleString();
    document.getElementById('goTerritory').innerText = `${s.territory}%`;
    document.getElementById('goRank').innerText = `#${s.rank}`;
    document.getElementById('goKills').innerText = `${s.eliminations}`;

    this.hud.style.display = 'none';
    this.gameOverModal.style.display = 'flex';
    this.gameOverModal.classList.remove('hidden');
  }

  showVictoryScreen() {
    const s = this.game.matchSummary || {
      score: this.game.score || 0,
      eliminations: this.game.eliminations || 0
    };

    document.getElementById('vicScore').innerText = (s.score || 0).toLocaleString();
    document.getElementById('vicKills').innerText = `${s.eliminations}`;

    this.hud.style.display = 'none';
    this.victoryModal.style.display = 'flex';
    this.victoryModal.classList.remove('hidden');
  }
}
