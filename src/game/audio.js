// src/game/audio.js
import { storage } from './storage.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.initialized = false;
    this.comboStep = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = storage.data.settings.music ? 0.22 : 0;
      this.bgmGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = storage.data.settings.sfx ? 0.35 : 0;
      this.sfxGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateSettings() {
    if (!this.initialized) return;
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(storage.data.settings.music ? 0.22 : 0, this.ctx.currentTime, 0.1);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(storage.data.settings.sfx ? 0.35 : 0, this.ctx.currentTime, 0.1);
    }
    if (storage.data.settings.music && !this.isBgmPlaying) {
      this.startCyberBgm();
    }
  }

  // --- Procedural Cyberpunk Synthesizer BGM ---
  startCyberBgm() {
    if (!this.initialized || !storage.data.settings.music || this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    // Cyberpunk synthwave progression: Am - F - C - G
    const bassNotes = [110, 87.31, 130.81, 98]; // A2, F2, C3, G2
    const arpChords = [
      [220, 261.63, 329.63, 440], // Am
      [174.61, 220, 261.63, 349.23], // F
      [261.63, 329.63, 392, 523.25], // C
      [196, 246.94, 293.66, 392] // G
    ];

    let chordIdx = 0;
    let step = 0;

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !storage.data.settings.music) return;
      const t = this.ctx.currentTime;
      const chord = arpChords[chordIdx];
      const freq = chord[step % chord.length];

      // Arp synth note
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.sin(t * 2) * 400, t);
      filter.Q.setValueAtTime(4, t);

      noteGain.gain.setValueAtTime(0.08, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 0.15);

      // Bass note on downbeats
      if (step === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassNotes[chordIdx], t);
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.6);
      }

      step = (step + 1) % 8;
      if (step === 0) {
        chordIdx = (chordIdx + 1) % arpChords.length;
      }

      this.bgmTimer = setTimeout(playStep, 135); // ~110 BPM 16th groove
    };

    playStep();
  }

  stopCyberBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }

  // --- Sound Effects ---

  playClick() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playCapture(areaRatio = 1) {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;
    const baseFreq = Math.min(600, 300 + areaRatio * 400);

    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + i * 0.04 + 0.2);
      g.gain.setValueAtTime(0.18, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.25);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.26);
    });
  }

  playBigCapture() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;
    const chord = [329.63, 415.3, 493.88, 659.25]; // E major chord
    chord.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.06);
      g.gain.setValueAtTime(0.22, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.45);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.46);
    });
  }

  playElimination() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;

    // Laser crackle
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);

    // Deep sub bass boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(140, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    boomGain.gain.setValueAtTime(0.5, t);
    boomGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(t);
    boom.stop(t + 0.42);
  }

  playPlayerDied() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.6);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  playCombo(comboCount) {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const t = this.ctx.currentTime;
    const step = Math.min(8, comboCount);
    const freq = 440 * Math.pow(1.12, step);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playVictory() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      g.gain.setValueAtTime(0.3, t + idx * 0.12);
      g.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.4);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.45);
    });
  }

  playReward() {
    if (!this.ctx || !storage.data.settings.sfx) return;
    const notes = [440, 554.37, 659.25, 880];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      g.gain.setValueAtTime(0.2, t + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.32);
    });
  }
}

export const audio = new AudioManager();
