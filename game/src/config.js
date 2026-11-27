// GOBBLE DASH — Turkey's Great Thanksgiving Escape
// config.js — every tunable number, level and palette in one place.
// The turkey (Giblet) runs from the farmyard, through the barn, through the
// kitchen, to the forest gate. Farmer Joe chases from behind the whole way.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const TURKEY_X = 300;
export const TURKEY_MIN_X = 180;
export const TURKEY_MAX_X = 560;

export const GRAVITY = 2400;
export const JUMP_VELOCITY = -1100;
export const BASE_SPEED = 270;
export const DASH_MULTIPLIER = 1.85;
export const DASH_TIME = 0.55;
export const DASH_MAX = 100;
export const DASH_DRAIN = 130;
export const DASH_REGEN = 26;
export const SLIDE_TIME = 0.85;
export const INVULN_TIME = 1.6;

export const ESCAPE_DISTANCE_M = 1800;
export const METERS_PER_PX = 1 / 50;

// Farmer Joe's chase: he never stops. The gap is the distance in pixels
// between Joe's nose and Giblet's tail. Hit 0 and Joe grabs the turkey.
// The gap moves by relative speed: Joe slower than the scroll in PATROL
// (the gap opens), level in SUSPICIOUS, faster in HUNTING (it closes).
export const FARMER = {
  startGap: 240,
  catchGap: 24,
  maxGap: 260,
  patrolSpeed: 0.9,
  suspiciousSpeed: 1.0,
  huntingSpeed: 1.1,
  suspiciousAt: 170,
  huntingAt: 110,
  resetGap: 260,
  hitPenalty: 60,
};

// Levels: the run crosses three named places, then the forest gate.
export const LEVELS = [
  {
    index: 0,
    name: 'LEVEL 1 — FARMYARD',
    place: 'The Farmyard',
    fromM: 0,
    toM: 600,
    speed: 270,
    spawnEvery: 1.15,
    palette: {
      skyTop: '#FFD98E', skyBottom: '#FF9E57', sun: '#FFE9A8',
      hillFar: '#A8B06A', hillNear: '#7A9B3F', ground: '#B0713A',
      grass: '#6FA03C', wall: null, accent: '#C96A2B',
    },
    hazards: ['fence', 'haybale', 'puddle', 'branch'],
    throwsKnives: false,
  },
  {
    index: 1,
    name: 'LEVEL 2 — BARN & COOP',
    place: 'Barn & Coop',
    fromM: 600,
    toM: 1200,
    speed: 320,
    spawnEvery: 0.95,
    palette: {
      skyTop: '#F7B267', skyBottom: '#E07840', sun: '#FFE3A1',
      hillFar: '#8A6B4A', hillNear: '#6B4A2F', ground: '#8A5A30',
      grass: '#C9A227', wall: '#A63A2E', accent: '#E8C96A',
    },
    hazards: ['fence', 'haybale', 'trap', 'branch', 'puddle'],
    throwsKnives: true,
  },
  {
    index: 2,
    name: 'LEVEL 3 — THE KITCHEN',
    place: 'The Kitchen',
    fromM: 1200,
    toM: 1800,
    speed: 375,
    spawnEvery: 0.85,
    palette: {
      skyTop: '#E8A34C', skyBottom: '#C96A2B', sun: '#FFE9A8',
      hillFar: '#7A4A30', hillNear: '#5E3520', ground: '#6B4A2F',
      grass: '#D8B45A', wall: '#E8B04B', accent: '#FF5A2B',
    },
    hazards: ['fence', 'oven', 'trap', 'branch', 'puddle'],
    throwsKnives: true,
  },
];

export const PICKUPS = {
  corn: { score: 50, label: 'CORN +50' },
  pie: { score: 100, label: 'PIE +100' },
  feather: { score: 25, label: 'FEATHER! DASH REFILLED' },
  wishbone: { score: 250, label: 'GOLDEN WISHBONE +250' },
};

export const OBSTACLES = {
  fence: { w: 26, h: 74, jump: true, slide: false, damage: 1 },
  haybale: { w: 64, h: 58, jump: true, slide: false, damage: 1 },
  puddle: { w: 90, h: 16, jump: true, slide: false, damage: 0, slow: true },
  branch: { w: 70, h: 46, jump: false, slide: true, damage: 1 },
  trap: { w: 56, h: 26, jump: true, slide: false, damage: 1 },
  oven: { w: 110, h: 120, jump: true, slide: false, damage: 1, fire: true },
};

export const BEST_KEY = 'gobble-dash-best';
