// src/data/missions.js

export const DAILY_MISSIONS = [
  { id: 'm_claim_5', title: 'Land Grabber', desc: 'Capture at least 15% territory in any match.', target: 15, unit: '%', type: 'territory_percent', rewardCoins: 150, rewardXp: 300 },
  { id: 'm_trails_10', title: 'Trail Blazer', desc: 'Successfully close 10 territory loops.', target: 10, unit: 'loops', type: 'loops_closed', rewardCoins: 200, rewardXp: 400 },
  { id: 'm_hunter_3', title: 'Apex Hunter', desc: 'Eliminate 3 opponents by cutting their trails.', target: 3, unit: 'kills', type: 'eliminations', rewardCoins: 250, rewardXp: 500 },
  { id: 'm_risk_taker', title: 'Risk Taker', desc: 'Capture 500+ grid units in a single trail.', target: 500, unit: 'units', type: 'single_capture', rewardCoins: 300, rewardXp: 600 }
];

export const WEEKLY_MISSIONS = [
  { id: 'w_dominator', title: 'Sector Dominator', desc: 'Finish 1st place in 3 matches.', target: 3, unit: 'wins', type: 'wins', rewardCoins: 800, rewardXp: 1500 },
  { id: 'w_total_land', title: 'Continental Expansion', desc: 'Capture a total of 15,000 grid units.', target: 15000, unit: 'units', type: 'total_captured', rewardCoins: 1000, rewardXp: 2000 },
  { id: 'w_kill_streak', title: 'Rampage', desc: 'Eliminate 15 total enemies across matches.', target: 15, unit: 'kills', type: 'total_eliminations', rewardCoins: 1200, rewardXp: 2500 }
];

export const DAILY_LOGIN_REWARDS = [
  { day: 1, title: 'Day 1', rewardType: 'coins', amount: 150, desc: '150 Rush Coins' },
  { day: 2, title: 'Day 2', rewardType: 'coins', amount: 250, desc: '250 Rush Coins' },
  { day: 3, title: 'Day 3', rewardType: 'trail', itemId: 'fire', desc: 'Uncommon Flame Trail' },
  { day: 4, title: 'Day 4', rewardType: 'coins', amount: 450, desc: '450 Rush Coins' },
  { day: 5, title: 'Day 5', rewardType: 'coins', amount: 700, desc: '700 Rush Coins' },
  { day: 6, title: 'Day 6', rewardType: 'territory', itemId: 'ice', desc: 'Rare Cryo Glacier Territory' },
  { day: 7, title: 'Day 7', rewardType: 'skin', itemId: 'galaxy', desc: 'Rare Nebula Starlight Skin' }
];
