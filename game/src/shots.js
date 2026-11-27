// shots.js — deterministic staged scenes for screenshots (?shot=<name>).
// Each pose builds a real game state through the same objects the game
// itself uses, then freezes physics so the frame is stable for the camera.
// These are renders of the game's own code, not mockups.

import { GROUND_Y, VIEW_W } from './config.js';

function placeCornRow(world, x0, y, count, gap = 46) {
  for (let i = 0; i < count; i++) {
    world.pickups.push({ kind: 'corn', x: x0 + i * gap, y, phase: i * 1.3, bob: 0 });
  }
}

export function applyShot(game, shot, seed) {
  const world = game.world;
  const turkey = game.turkey;
  const farmer = game.farmer;
  game.frozen = true;

  if (shot === 'start') {
    // Title screen over a quiet farmyard morning (barn scrolled out of view).
    game.state = 'title';
    game.best = 2840;
    turkey.reset();
    turkey.x = 300;
    farmer.reset();
    farmer.turkeyX = turkey.x;
    world.reset(seed);
    world.scrollX = 4000;
    return;
  }

  if (shot === 'end') {
    // The ESCAPED end screen with a full score card.
    game.state = 'end';
    game.endKind = 'escaped';
    game.score = 7420;
    game.distanceM = 1800;
    game.elapsed = 154;
    game.corn = 47;
    game.lives = 2;
    game.best = 7420;
    world.reset(seed);
    world.scrollX = 900;
    turkey.reset();
    turkey.x = 300;
    farmer.reset();
    farmer.turkeyX = turkey.x;
    return;
  }

  if (shot === 'farmyard') {
    // Level 1 mid-action: fences and hay bales, corn arc, Joe suspicious.
    game.state = 'playing';
    game.score = 1240;
    game.distanceM = 212;
    game.elapsed = 47;
    game.lives = 3;
    game.corn = 9;
    game.combo = 2;
    game.comboTimer = 1.2;
    game.best = 2840;
    world.reset(seed);
    world.levelIndex = 0;
    world.distanceM = 212;
    world.distancePx = 212 * 50;
    world.speed = 270;
    world.scrollX = 1200;
    turkey.reset();
    turkey.x = 320;
    turkey.y = GROUND_Y - 120;
    turkey.vy = 120;
    turkey.runCycle = 2.4;
    farmer.reset();
    farmer.turkeyX = turkey.x;
    farmer.gap = 165;
    farmer.state = 'SUSPICIOUS';
    farmer.angry = 0.5;
    farmer.runCycle = 1.1;
    world.obstacles.push(
      { kind: 'fence', x: 560, y: GROUND_Y, w: 26, h: 74, phase: 0.4 },
      { kind: 'haybale', x: 760, y: GROUND_Y, w: 64, h: 58, phase: 1.2 },
      { kind: 'fence', x: 980, y: GROUND_Y, w: 26, h: 74, phase: 2.1 },
      { kind: 'branch', x: 1150, y: GROUND_Y, w: 70, h: 46, phase: 0.8 },
    );
    placeCornRow(world, 500, GROUND_Y - 150, 3);
    placeCornRow(world, 830, GROUND_Y - 46, 4);
    world.pickups.push({ kind: 'pie', x: 700, y: GROUND_Y - 140, phase: 0.5, bob: 0 });
    world.pickups.push({ kind: 'feather', x: 1060, y: GROUND_Y - 110, phase: 1.0, bob: 0 });
    world.burst(420, GROUND_Y - 60, '#F1C40F', 8);
    world.floaters.push({ x: 620, y: GROUND_Y - 190, text: 'CORN +50 x2', color: '#FDEBD0', life: 1.1 });
    return;
  }

  // Default: 'play' — the cover. Level 3, the kitchen, dense mid-action:
  // Giblet mid-jump over a spinning carving knife, an oven roaring ahead,
  // Joe HUNTING right behind him, corn and pie everywhere, exit in sight.
  game.state = 'playing';
  game.score = 4860;
  game.distanceM = 1347;
  game.elapsed = 84;
  game.lives = 2;
  game.corn = 14;
  game.combo = 3;
  game.comboTimer = 1.4;
  game.best = 4860;
  world.reset(seed);
  world.levelIndex = 2;
  world.distanceM = 1347;
  world.distancePx = 1347 * 50;
  world.speed = 375;
  world.scrollX = 5200;
  turkey.reset();
  turkey.x = 330;
  turkey.y = GROUND_Y - 150;
  turkey.vy = 60;
  turkey.runCycle = 3.1;
  turkey.dashMeter = 72;
  farmer.reset();
  farmer.turkeyX = turkey.x;
  farmer.gap = 92;
  farmer.state = 'HUNTING';
  farmer.angry = 0.92;
  farmer.runCycle = 2.2;
  world.obstacles.push(
    { kind: 'oven', x: 700, y: GROUND_Y, w: 110, h: 120, phase: 0.7, flame: 0.9 },
    { kind: 'trap', x: 900, y: GROUND_Y, w: 56, h: 26, phase: 1.4 },
    { kind: 'oven', x: 1120, y: GROUND_Y, w: 110, h: 120, phase: 2.6, flame: 0.7 },
    { kind: 'branch', x: 520, y: GROUND_Y, w: 70, h: 46, phase: 0.3 },
  );
  world.knives.push({ x: 560, y: GROUND_Y - 120, vx: -600, rot: 0.8, rotSpeed: 9 });
  world.knives.push({ x: 1010, y: GROUND_Y - 80, vx: -600, rot: 2.1, rotSpeed: 9 });
  placeCornRow(world, 430, GROUND_Y - 190, 3);
  placeCornRow(world, 800, GROUND_Y - 46, 4);
  world.pickups.push({ kind: 'pie', x: 755, y: GROUND_Y - 165, phase: 0.5, bob: 0 });
  world.pickups.push({ kind: 'wishbone', x: 990, y: GROUND_Y - 150, phase: 1.0, bob: 0 });
  world.pickups.push({ kind: 'feather', x: 1220, y: GROUND_Y - 100, phase: 1.7, bob: 0 });
  world.burst(430, GROUND_Y - 120, '#F1C40F', 10);
  world.burst(760, GROUND_Y - 140, '#FFD23F', 8);
  world.floaters.push({ x: 560, y: GROUND_Y - 230, text: 'PIE +100 x3', color: '#FDEBD0', life: 1.1 });
  world.floaters.push({ x: 980, y: GROUND_Y - 210, text: 'WISHBONE +250', color: '#F1C40F', life: 1.1 });
  game.showBanner('LEVEL 3 — THE KITCHEN', 'The oven is lit — 453m to the forest gate!');
  game.bannerTimer = 99;
}
