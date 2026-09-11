// src/data/skins.js

export const RARITIES = {
  COMMON: { name: 'COMMON', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#64748b' },
  UNCOMMON: { name: 'UNCOMMON', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#22c55e' },
  RARE: { name: 'RARE', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#0ea5e9' },
  EPIC: { name: 'EPIC', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: '#a855f7' },
  LEGENDARY: { name: 'LEGENDARY', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: '#f59e0b' },
  MYTHIC: { name: 'MYTHIC', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: '#e11d48' }
};

export const CHARACTER_SKINS = [
  { id: 'starter', name: 'Starter Core', rarity: 'COMMON', price: 0, desc: 'Simple futuristic energy core.', color: '#00f0ff', secondary: '#0284c7', glow: 'rgba(0, 240, 255, 0.8)', pattern: 'pulse' },
  { id: 'neon', name: 'Neon Overdrive', rarity: 'COMMON', price: 250, desc: 'Bright glowing futuristic core.', color: '#39ff14', secondary: '#16a34a', glow: 'rgba(57, 255, 20, 0.9)', pattern: 'rings' },
  { id: 'cyber', name: 'Cyberpunk Drone', rarity: 'UNCOMMON', price: 500, desc: 'Mechanical cyberpunk design.', color: '#ff007f', secondary: '#00f0ff', glow: 'rgba(255, 0, 127, 0.9)', pattern: 'cyber' },
  { id: 'fire', name: 'Inferno Core', rarity: 'UNCOMMON', price: 650, desc: 'Animated flame-themed core.', color: '#ff4500', secondary: '#ffbb00', glow: 'rgba(255, 69, 0, 0.9)', pattern: 'flame' },
  { id: 'ice', name: 'Glacial Crystal', rarity: 'UNCOMMON', price: 750, desc: 'Frozen crystal appearance.', color: '#a5f3fc', secondary: '#0284c7', glow: 'rgba(165, 243, 252, 0.9)', pattern: 'crystal' },
  { id: 'shadow', name: 'Shadow Phantom', rarity: 'RARE', price: 1000, desc: 'Dark mysterious energy design.', color: '#6b21a8', secondary: '#1e1b4b', glow: 'rgba(168, 85, 247, 0.8)', pattern: 'vortex' },
  { id: 'galaxy', name: 'Nebula Starlight', rarity: 'RARE', price: 1200, desc: 'Animated star and galaxy texture.', color: '#c084fc', secondary: '#38bdf8', glow: 'rgba(192, 132, 252, 0.9)', pattern: 'stars' },
  { id: 'plasma', name: 'Plasma Spark', rarity: 'RARE', price: 1400, desc: 'Electric plasma ball energy.', color: '#f43f5e', secondary: '#8b5cf6', glow: 'rgba(244, 63, 94, 0.9)', pattern: 'plasma' },
  { id: 'toxic', name: 'Toxic Hazard', rarity: 'RARE', price: 1500, desc: 'Green radioactive-style energy.', color: '#a3e635', secondary: '#15803d', glow: 'rgba(163, 230, 53, 0.9)', pattern: 'hazard' },
  { id: 'lightning', name: 'Thunder Spark', rarity: 'EPIC', price: 2000, desc: 'Electric storm energy design.', color: '#fde047', secondary: '#0284c7', glow: 'rgba(253, 224, 71, 0.9)', pattern: 'lightning' },
  { id: 'samurai', name: 'Cyber Samurai', rarity: 'EPIC', price: 2200, desc: 'Futuristic samurai-inspired core.', color: '#ef4444', secondary: '#18181b', glow: 'rgba(239, 68, 68, 0.9)', pattern: 'samurai' },
  { id: 'robot', name: 'Mecha V2', rarity: 'EPIC', price: 2500, desc: 'Advanced robotic chassis.', color: '#38bdf8', secondary: '#475569', glow: 'rgba(56, 189, 248, 0.9)', pattern: 'mecha' },
  { id: 'hologram', name: 'Holo Mirage', rarity: 'EPIC', price: 2800, desc: 'Transparent holographic character.', color: '#2dd4bf', secondary: '#0f766e', glow: 'rgba(45, 212, 191, 0.8)', pattern: 'holo' },
  { id: 'gold', name: 'Midas Gold', rarity: 'LEGENDARY', price: 3500, desc: 'Premium metallic gold design.', color: '#eab308', secondary: '#ca8a04', glow: 'rgba(234, 179, 8, 0.95)', pattern: 'gold' },
  { id: 'diamond', name: 'Diamond Prism', rarity: 'LEGENDARY', price: 4000, desc: 'Refractive crystal diamond appearance.', color: '#e0e7ff', secondary: '#6366f1', glow: 'rgba(224, 231, 255, 0.95)', pattern: 'prism' },
  { id: 'phoenix', name: 'Solar Phoenix', rarity: 'LEGENDARY', price: 4500, desc: 'Animated fiery bird-inspired energy.', color: '#ff6b00', secondary: '#dc2626', glow: 'rgba(255, 107, 0, 0.95)', pattern: 'phoenix' },
  { id: 'cosmic', name: 'Cosmic Entity', rarity: 'LEGENDARY', price: 5000, desc: 'Deep space animated skin.', color: '#ec4899', secondary: '#6366f1', glow: 'rgba(236, 72, 153, 0.95)', pattern: 'cosmic' },
  { id: 'royal', name: 'Imperial Crown', rarity: 'LEGENDARY', price: 5500, desc: 'Premium crown-inspired design.', color: '#f59e0b', secondary: '#7c3aed', glow: 'rgba(245, 158, 11, 0.95)', pattern: 'crown' },
  { id: 'void', name: 'Void Singularity', rarity: 'MYTHIC', price: 8000, desc: 'Black-hole inspired dimensional rupture.', color: '#09090b', secondary: '#a855f7', glow: 'rgba(168, 85, 247, 1)', pattern: 'void' },
  { id: 'dominator', name: 'Apex Dominator', rarity: 'MYTHIC', price: 10000, desc: 'Extremely rare legendary conquered skin.', color: '#ff0055', secondary: '#ffd700', glow: 'rgba(255, 0, 85, 1)', pattern: 'dominator' }
];

export const TRAIL_SKINS = [
  { id: 'standard', name: 'Neon Stream', rarity: 'COMMON', price: 0, desc: 'Classic glowing neon trail.', color: '#00f0ff', glow: '#00f0ff', particle: 'dot' },
  { id: 'neon', name: 'Cyber Lime', rarity: 'COMMON', price: 200, desc: 'High-voltage electric green.', color: '#39ff14', glow: '#39ff14', particle: 'spark' },
  { id: 'fire', name: 'Flame Trail', rarity: 'UNCOMMON', price: 400, desc: 'Trailing smoke and burning embers.', color: '#ff5500', glow: '#ffaa00', particle: 'ember' },
  { id: 'ice', name: 'Frost Trail', rarity: 'UNCOMMON', price: 400, desc: 'Crystalline snowflakes in your wake.', color: '#7dd3fc', glow: '#38bdf8', particle: 'snow' },
  { id: 'lightning', name: 'Lightning Arc', rarity: 'RARE', price: 750, desc: 'Snapping electric bolts.', color: '#fef08a', glow: '#eab308', particle: 'spark' },
  { id: 'rainbow', name: 'Prism Spectrum', rarity: 'RARE', price: 900, desc: 'Chromatic rainbow transition.', color: 'rainbow', glow: '#ec4899', particle: 'rainbow' },
  { id: 'plasma', name: 'Plasma Surge', rarity: 'RARE', price: 950, desc: 'High energy ion discharge.', color: '#f43f5e', glow: '#ec4899', particle: 'plasma' },
  { id: 'pixel', name: '8-Bit Glitch', rarity: 'EPIC', price: 1200, desc: 'Retro digital pixel trail.', color: '#a855f7', glow: '#06b6d4', particle: 'pixel' },
  { id: 'smoke', name: 'Shadow Vapor', rarity: 'EPIC', price: 1300, desc: 'Dark ethereal smoke.', color: '#64748b', glow: '#475569', particle: 'smoke' },
  { id: 'stars', name: 'Star Dust', rarity: 'EPIC', price: 1500, desc: 'Sparkling celestial stardust.', color: '#fde047', glow: '#60a5fa', particle: 'star' },
  { id: 'energy_beam', name: 'Laser Beam', rarity: 'LEGENDARY', price: 2200, desc: 'Dense pulsing laser trail.', color: '#00ffff', glow: '#ffffff', particle: 'beam' },
  { id: 'galaxy', name: 'Nebula Flow', rarity: 'LEGENDARY', price: 2600, desc: 'Twinkling galaxy cosmos.', color: '#d946ef', glow: '#8b5cf6', particle: 'nebula' },
  { id: 'golden', name: 'Royal Gold', rarity: 'MYTHIC', price: 4000, desc: 'Pure gleaming golden dust.', color: '#fbbf24', glow: '#f59e0b', particle: 'gold' }
];

export const TERRITORY_SKINS = [
  { id: 'neon_grid', name: 'Neon Grid', rarity: 'COMMON', price: 0, desc: 'Classic digital glowing grid.', pattern: 'grid', fillAlpha: 0.35, borderGlow: '#00f0ff' },
  { id: 'cyber_city', name: 'Cyber City', rarity: 'UNCOMMON', price: 300, desc: 'Futuristic circuit highway pattern.', pattern: 'circuit', fillAlpha: 0.4, borderGlow: '#ff007f' },
  { id: 'lava', name: 'Molten Core', rarity: 'UNCOMMON', price: 450, desc: 'Cracked burning volcanic rock.', pattern: 'lava', fillAlpha: 0.45, borderGlow: '#ff4500' },
  { id: 'ice', name: 'Cryo Glacier', rarity: 'RARE', price: 700, desc: 'Frosted ice sheet with reflections.', pattern: 'ice', fillAlpha: 0.4, borderGlow: '#38bdf8' },
  { id: 'digital', name: 'Byte Matrix', rarity: 'RARE', price: 850, desc: 'Streaming binary digital code.', pattern: 'digital', fillAlpha: 0.38, borderGlow: '#22c55e' },
  { id: 'circuit', name: 'Quantum Chip', rarity: 'EPIC', price: 1200, desc: 'Microscopic illuminated circuits.', pattern: 'chip', fillAlpha: 0.42, borderGlow: '#a855f7' },
  { id: 'crystal', name: 'Prism Facets', rarity: 'EPIC', price: 1500, desc: 'Geometric crystal facets.', pattern: 'crystal', fillAlpha: 0.4, borderGlow: '#e0e7ff' },
  { id: 'energy_wave', name: 'Pulse Wave', rarity: 'LEGENDARY', price: 2200, desc: 'Rippling harmonic energy waves.', pattern: 'wave', fillAlpha: 0.45, borderGlow: '#f43f5e' },
  { id: 'galaxy', name: 'Deep Cosmos', rarity: 'LEGENDARY', price: 2600, desc: 'Starry galaxy cluster.', pattern: 'galaxy', fillAlpha: 0.45, borderGlow: '#8b5cf6' },
  { id: 'matrix', name: 'Apex Singularity', rarity: 'MYTHIC', price: 4000, desc: 'Hexagonal warping spatial tear.', pattern: 'void', fillAlpha: 0.5, borderGlow: '#ffd700' }
];

export const ELIMINATION_EFFECTS = [
  { id: 'explosion', name: 'Pulse Blast', rarity: 'COMMON', price: 0, desc: 'Expanding neon shockwave ring.', type: 'ring', count: 30 },
  { id: 'lightning_burst', name: 'Lightning Strike', rarity: 'UNCOMMON', price: 300, desc: 'Arcing lightning forks.', type: 'lightning', count: 40 },
  { id: 'fire_burst', name: 'Solar Flare', rarity: 'UNCOMMON', price: 450, desc: 'Blazing fireball eruption.', type: 'fire', count: 45 },
  { id: 'ice_shatter', name: 'Frost Shatter', rarity: 'RARE', price: 700, desc: 'Shattering crystal shards.', type: 'ice', count: 50 },
  { id: 'pixel_explosion', name: 'Voxel Disintegrate', rarity: 'RARE', price: 850, desc: 'Disintegrates into flying 3D pixels.', type: 'pixel', count: 60 },
  { id: 'energy_shockwave', name: 'Supernova Burst', rarity: 'EPIC', price: 1200, desc: 'Double cascading energy shockwave.', type: 'shockwave', count: 70 },
  { id: 'star_burst', name: 'Cosmic Supercluster', rarity: 'EPIC', price: 1500, desc: 'Exploding stars and dust.', type: 'star', count: 80 },
  { id: 'neon_explosion', name: 'Cyber Fireworks', rarity: 'LEGENDARY', price: 2500, desc: 'Multi-colored neon firework explosion.', type: 'firework', count: 100 },
  { id: 'galaxy_implosion', name: 'Black Hole Implosion', rarity: 'MYTHIC', price: 4500, desc: 'Inward gravitational collapse then mega blast.', type: 'implosion', count: 120 }
];
