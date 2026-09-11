// src/game/storage.js

const STORAGE_KEY = 'territory_rush_save_v1';

const DEFAULT_STATE = {
  playerName: 'YOU',
  coins: 500,
  xp: 0,
  level: 1,
  equipped: {
    character: 'starter',
    trail: 'standard',
    territory: 'neon_grid',
    elimination: 'explosion'
  },
  unlocked: {
    character: ['starter'],
    trail: ['standard'],
    territory: ['neon_grid'],
    elimination: ['explosion']
  },
  stats: {
    matchesPlayed: 0,
    matchesWon: 0,
    totalEliminations: 0,
    totalCapturedCells: 0,
    maxTerritoryPercent: 0,
    largestSingleCapture: 0,
    longestSurvivalSec: 0,
    highestScore: 0
  },
  missions: {
    dailyProgress: {},
    weeklyProgress: {},
    claimed: []
  },
  achievements: {
    progress: {},
    unlocked: []
  },
  dailyReward: {
    lastClaimDate: null,
    currentDay: 0
  },
  settings: {
    music: true,
    sfx: true,
    screenShake: true,
    particleQuality: 'high',
    controlMode: 'keyboard_mouse' // or 'touch'
  }
};

class StorageManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          equipped: { ...DEFAULT_STATE.equipped, ...(parsed.equipped || {}) },
          unlocked: { ...DEFAULT_STATE.unlocked, ...(parsed.unlocked || {}) },
          stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
          missions: { ...DEFAULT_STATE.missions, ...(parsed.missions || {}) },
          achievements: { ...DEFAULT_STATE.achievements, ...(parsed.achievements || {}) },
          dailyReward: { ...DEFAULT_STATE.dailyReward, ...(parsed.dailyReward || {}) },
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to load storage, using default', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  addCoins(amount) {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
    return this.data.coins;
  }

  addXp(amount) {
    this.data.xp += amount;
    let required = this.getXpForNextLevel(this.data.level);
    let leveledUp = false;
    while (this.data.xp >= required) {
      this.data.xp -= required;
      this.data.level += 1;
      this.data.coins += 200 * this.data.level; // level up bonus!
      leveledUp = true;
      required = this.getXpForNextLevel(this.data.level);
    }
    this.save();
    return { level: this.data.level, xp: this.data.xp, required, leveledUp };
  }

  getXpForNextLevel(level) {
    return Math.floor(500 * Math.pow(1.25, level - 1));
  }

  unlockItem(category, itemId) {
    if (!this.data.unlocked[category]) this.data.unlocked[category] = [];
    if (!this.data.unlocked[category].includes(itemId)) {
      this.data.unlocked[category].push(itemId);
      this.save();
    }
  }

  equipItem(category, itemId) {
    if (this.data.unlocked[category] && this.data.unlocked[category].includes(itemId)) {
      this.data.equipped[category] = itemId;
      this.save();
      return true;
    }
    return false;
  }

  isUnlocked(category, itemId) {
    return this.data.unlocked[category] && this.data.unlocked[category].includes(itemId);
  }

  updateStat(key, value, isMax = false) {
    if (isMax) {
      this.data.stats[key] = Math.max(this.data.stats[key] || 0, value);
    } else {
      this.data.stats[key] = (this.data.stats[key] || 0) + value;
    }
    this.save();
  }

  checkDailyReward() {
    const today = new Date().toISOString().slice(0, 10);
    const last = this.data.dailyReward.lastClaimDate;
    if (!last) {
      return { canClaim: true, day: 1 };
    }
    const lastDate = new Date(last);
    const nowDate = new Date(today);
    const diffDays = Math.round((nowDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const nextDay = (this.data.dailyReward.currentDay % 7) + 1;
      return { canClaim: true, day: nextDay };
    } else if (diffDays > 1) {
      // Streak reset
      return { canClaim: true, day: 1 };
    }
    return { canClaim: false, day: this.data.dailyReward.currentDay };
  }

  claimDailyReward(day, reward) {
    const today = new Date().toISOString().slice(0, 10);
    this.data.dailyReward.lastClaimDate = today;
    this.data.dailyReward.currentDay = day;

    if (reward.rewardType === 'coins') {
      this.addCoins(reward.amount);
    } else if (reward.rewardType === 'trail') {
      this.unlockItem('trail', reward.itemId);
    } else if (reward.rewardType === 'territory') {
      this.unlockItem('territory', reward.itemId);
    } else if (reward.rewardType === 'skin') {
      this.unlockItem('character', reward.itemId);
    }
    this.save();
  }
}

export const storage = new StorageManager();
