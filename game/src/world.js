// world.js — the scrolling world: level progression, obstacle and pickup
// spawning, thrown carving knives, the forest gate, particles, and all the
// parallax scenery (farmyard fences, barn walls, kitchen tiles, forest).

import { LEVELS, OBSTACLES, PICKUPS, GROUND_Y, ESCAPE_DISTANCE_M, VIEW_W, VIEW_H } from './config.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor() {
    this.reset(1);
  }

  reset(seed) {
    this.rand = mulberry32(seed);
    this.distancePx = 0;
    this.distanceM = 0;
    this.speed = LEVELS[0].speed;
    this.levelIndex = 0;
    this.obstacles = [];
    this.pickups = [];
    this.knives = [];
    this.particles = [];
    this.floaters = [];
    this.spawnTimer = 1.2;
    this.knifeTimer = 4;
    this.gateX = null;
    this.scrollX = 0;
    this.shake = 0;
    this.flash = 0;
  }

  level() {
    return LEVELS[this.levelIndex];
  }

  get escaping() {
    return this.distanceM >= ESCAPE_DISTANCE_M;
  }

  // Distance the turkey still has to run, in metres.
  get remainingM() {
    return Math.max(0, ESCAPE_DISTANCE_M - this.distanceM);
  }

  update(dt, turkey, farmer, onEvent) {
    const level = this.level();
    this.speed = level.speed;
    const speed = this.speed * turkey.speedMultiplier;
    this.distancePx += speed * dt;
    this.distanceM = this.distancePx / 50;
    this.scrollX += speed * dt;

    // Level up as the run crosses each boundary.
    const nextIndex = LEVELS.findIndex((l) => this.distanceM < l.toM);
    const newIndex = nextIndex === -1 ? LEVELS.length - 1 : nextIndex;
    if (newIndex !== this.levelIndex) {
      this.levelIndex = newIndex;
      onEvent({ type: 'level', level: LEVELS[newIndex] });
    }
    if (this.escaping && this.gateX === null) {
      this.gateX = VIEW_W + 240;
      onEvent({ type: 'gate' });
    }

    // Spawn obstacles and pickup trails.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && !this.escaping) {
      this.spawnTimer = level.spawnEvery * (0.85 + this.rand() * 0.4);
      this.spawnPattern(level);
    }
    // Farmer Joe throws carving knives from level 2 on.
    if (level.throwsKnives && !this.escaping) {
      this.knifeTimer -= dt;
      if (this.knifeTimer <= 0) {
        this.knifeTimer = 2.6 + this.rand() * 1.6;
        this.knives.push({
          x: VIEW_W + 40,
          y: GROUND_Y - 46 - this.rand() * 40,
          vx: -(speed + 260),
          rot: 0,
          rotSpeed: 9,
        });
        onEvent({ type: 'knife' });
      }
    }

    const move = speed * dt;
    for (const o of this.obstacles) {
      o.x -= move;
      if (o.kind === 'oven') o.flame = 0.5 + 0.5 * Math.sin(o.phase + performance.now() / 130);
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -160);
    for (const p of this.pickups) {
      p.x -= move;
      p.bob = Math.sin(p.phase + performance.now() / 300) * 5;
    }
    this.pickups = this.pickups.filter((p) => p.x > -60);
    for (const k of this.knives) {
      k.x += k.vx * dt;
      k.rot += k.rotSpeed * dt;
    }
    this.knives = this.knives.filter((k) => k.x > -60);

    if (this.gateX !== null) this.gateX -= move;

    // Particles and floating score text.
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 500 * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.y -= 42 * dt;
      f.life -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  spawnPattern(level) {
    // Fair spacing: never spawn a new obstacle until the previous one has
    // travelled at least 430px, so a jump + a slide can never overlap.
    const last = this.obstacles[this.obstacles.length - 1];
    if (last && last.x > VIEW_W + 60 - 430) return;
    const kinds = level.hazards;
    const kind = kinds[Math.floor(this.rand() * kinds.length)];
    const def = OBSTACLES[kind];
    const x = VIEW_W + 60;
    if (kind === 'oven') {
      this.obstacles.push({ kind, x, y: GROUND_Y, w: def.w, h: def.h, phase: this.rand() * 6 });
      // An oven always guards a pie: jump the flames, take the pie.
      this.pickups.push({ kind: 'pie', x: x + 55, y: GROUND_Y - 130, phase: this.rand() * 6 });
      return;
    }
    this.obstacles.push({ kind, x, y: GROUND_Y, w: def.w, h: def.h, phase: this.rand() * 6 });
    // Pickup trails: corn arcs over jumpable hazards, rows on the ground.
    const roll = this.rand();
    if (roll < 0.45 && def.jump) {
      for (let i = 0; i < 3; i++) {
        this.pickups.push({
          kind: 'corn', x: x - 30 + i * 45, y: GROUND_Y - 110 - Math.sin((i / 2) * Math.PI) * 55,
          phase: this.rand() * 6,
        });
      }
    } else if (roll < 0.7) {
      for (let i = 0; i < 3; i++) {
        this.pickups.push({ kind: 'corn', x: x + 90 + i * 46, y: GROUND_Y - 46, phase: this.rand() * 6 });
      }
    } else if (roll < 0.8) {
      this.pickups.push({ kind: 'feather', x: x + 120, y: GROUND_Y - 90, phase: this.rand() * 6 });
    } else if (roll < 0.86) {
      this.pickups.push({ kind: 'wishbone', x: x + 120, y: GROUND_Y - 100, phase: this.rand() * 6 });
    }
  }

  burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = this.rand() * Math.PI * 2;
      const speed = 60 + this.rand() * 220;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120,
        life: 0.5 + this.rand() * 0.5, color, size: 3 + this.rand() * 5,
      });
    }
  }

  floater(x, y, text, color = '#FFFFFF') {
    this.floaters.push({ x, y, text, color, life: 1.1 });
  }

  obstacleBox(o) {
    // Inset a few pixels: the art is wider than the danger.
    const inset = 5;
    if (o.kind === 'puddle') return { x: o.x - o.w / 2, y: GROUND_Y - 10, w: o.w, h: 10 };
    if (o.kind === 'branch') return { x: o.x - o.w / 2 + inset, y: GROUND_Y - 92, w: o.w - inset * 2, h: 46 };
    if (o.kind === 'oven') return { x: o.x - o.w / 2 + inset, y: GROUND_Y - o.h, w: o.w - inset * 2, h: o.h };
    return { x: o.x - o.w / 2 + inset, y: GROUND_Y - o.h, w: o.w - inset * 2, h: o.h };
  }

  pickupBox(p) {
    return { x: p.x - 18, y: p.y - 18, w: 36, h: 36 };
  }

  knifeBox(k) {
    return { x: k.x - 24, y: k.y - 8, w: 48, h: 16 };
  }

  // ---- scenery -----------------------------------------------------------

  drawBackground(ctx, time) {
    const pal = this.level().palette;
    // Logical view space: 1280x720. main.js scales it onto the canvas.
    const W = VIEW_W;
    const H = VIEW_H;
    const groundScreenY = GROUND_Y;

    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, groundScreenY);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundScreenY + 2);

    // Sun.
    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.14, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.14, 64, 0, Math.PI * 2);
    ctx.fill();

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 248, 235, 0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 340 - this.scrollX * 0.12) % (W + 300) + W + 300) % (W + 300) - 150;
      const cy = 60 + i * 34;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 40, cy + 6, 44, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Birds crossing the sky.
    ctx.strokeStyle = 'rgba(90, 50, 20, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 460 + 200 - this.scrollX * 0.25) % (W + 200) + W + 200) % (W + 200) - 100;
      const by = 110 + i * 46;
      const flap = Math.sin(time * 6 + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by);
      ctx.quadraticCurveTo(bx - 4, by - 8 - flap, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 8 - flap, bx + 12, by);
      ctx.stroke();
    }

    // Far hills.
    ctx.fillStyle = pal.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    for (let x = 0; x <= W; x += 40) {
      const y = groundScreenY - 70 - Math.sin((x + this.scrollX * 0.2) / 260) * 34;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, groundScreenY);
    ctx.closePath();
    ctx.fill();

    // Near hills / treeline.
    ctx.fillStyle = pal.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    for (let x = 0; x <= W; x += 40) {
      const y = groundScreenY - 26 - Math.sin((x + this.scrollX * 0.45) / 190 + 2) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, groundScreenY);
    ctx.closePath();
    ctx.fill();

    // Level dressing: barn wall, kitchen tiles, or farm fence line. The wall
    // runs high so the sky never swallows the top of the frame.
    if (this.level().palette.wall) {
      const wallTop = groundScreenY - 330;
      ctx.fillStyle = this.level().palette.wall;
      ctx.fillRect(0, wallTop, W, 330);
      if (this.levelIndex === 1) {
        // Barn planks.
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 3;
        for (let x = 0; x < W; x += 90) {
          ctx.beginPath();
          ctx.moveTo(x, wallTop);
          ctx.lineTo(x, groundScreenY);
          ctx.stroke();
        }
        // Barn door, hayloft window and a hanging lantern.
        ctx.fillStyle = '#6B2D20';
        ctx.fillRect(W * 0.06, groundScreenY - 170, 120, 170);
        ctx.fillStyle = '#F7DC6F';
        ctx.fillRect(W * 0.68, wallTop + 40, 90, 60);
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.arc(W * 0.45, wallTop + 70, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDEBD0';
        ctx.beginPath();
        ctx.arc(W * 0.45, wallTop + 70, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Kitchen checker tiles.
        for (let ty = 0; ty < 5; ty++) {
          for (let tx = 0; tx < 16; tx++) {
            if ((tx + ty) % 2 === 0) {
              ctx.fillStyle = 'rgba(255,255,255,0.22)';
              ctx.fillRect(tx * 80, wallTop + ty * 66, 80, 66);
            }
          }
        }
        // A window onto the farmyard, and a shelf of jam jars.
        ctx.fillStyle = '#AED6F1';
        ctx.fillRect(W * 0.08, wallTop + 30, 150, 110);
        ctx.fillStyle = '#58D68D';
        ctx.fillRect(W * 0.08, wallTop + 110, 150, 30);
        ctx.strokeStyle = '#5E3520';
        ctx.lineWidth = 4;
        ctx.strokeRect(W * 0.08, wallTop + 30, 150, 110);
        ctx.beginPath();
        ctx.moveTo(W * 0.08 + 75, wallTop + 30);
        ctx.lineTo(W * 0.08 + 75, wallTop + 140);
        ctx.stroke();
        ctx.fillStyle = '#6B4226';
        ctx.fillRect(W * 0.68, wallTop + 190, 220, 12);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = ['#C0392B', '#E67E22', '#7D3C98', '#2E7D32'][i];
          ctx.beginPath();
          ctx.roundRect(W * 0.69 + i * 52, wallTop + 150, 40, 40, 6);
          ctx.fill();
        }
        // Hanging pots.
        ctx.strokeStyle = '#5E3520';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          const px = W * (0.36 + i * 0.14);
          ctx.beginPath();
          ctx.moveTo(px, wallTop);
          ctx.lineTo(px, wallTop + 42);
          ctx.stroke();
          ctx.fillStyle = '#7B7D7F';
          ctx.beginPath();
          ctx.arc(px, wallTop + 60, 22, 0, Math.PI);
          ctx.fill();
        }
      }
    } else {
      // Farmyard: fence posts marching past.
      ctx.fillStyle = '#8A5A30';
      const spacing = 130;
      const offset = -(this.scrollX % spacing);
      for (let x = offset; x < W + spacing; x += spacing) {
        ctx.fillRect(x, groundScreenY - 66, 10, 66);
        ctx.beginPath();
        ctx.moveTo(x - 4, groundScreenY - 66);
        ctx.lineTo(x + 5, groundScreenY - 78);
        ctx.lineTo(x + 14, groundScreenY - 66);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#8A5A30';
      ctx.fillRect(0, groundScreenY - 62, W, 7);
      ctx.fillRect(0, groundScreenY - 38, W, 7);
      // A red barn on the horizon.
      const barnX = W * 0.72 - ((this.scrollX * 0.3) % (W + 400));
      ctx.fillStyle = '#A63A2E';
      ctx.fillRect(barnX, groundScreenY - 150, 190, 150);
      ctx.fillStyle = '#7B241C';
      ctx.beginPath();
      ctx.moveTo(barnX - 14, groundScreenY - 150);
      ctx.lineTo(barnX + 95, groundScreenY - 210);
      ctx.lineTo(barnX + 204, groundScreenY - 150);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F7DC6F';
      ctx.fillRect(barnX + 70, groundScreenY - 120, 50, 50);
    }

    // Ground.
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, groundScreenY, W, H - groundScreenY);
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, groundScreenY, W, 14);
    // Dirt speckles scrolling past.
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 26; i++) {
      const sx = ((i * 173 - this.scrollX) % (W + 60) + W + 60) % (W + 60) - 30;
      const sy = groundScreenY + 26 + ((i * 53) % (H - groundScreenY - 34));
      ctx.fillRect(sx, sy, 12, 4);
    }
  }

  drawGate(ctx) {
    if (this.gateX === null) return;
    const x = this.gateX;
    // The forest gate: two pine trees and a glowing "FREEDOM" arch.
    ctx.save();
    ctx.translate(x, GROUND_Y);
    ctx.fillStyle = '#1E8449';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 90, 0);
      ctx.lineTo(side * 60, -120);
      ctx.lineTo(side * 80, -120);
      ctx.lineTo(side * 55, -200);
      ctx.lineTo(side * 72, -200);
      ctx.lineTo(side * 40, -280);
      ctx.lineTo(side * 100, -280);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(-100, -40, 14, 40);
    ctx.fillRect(86, -40, 14, 40);
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.roundRect(-86, -300, 172, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#7D6608';
    ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FOREST GATE', 0, -278);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('FREEDOM THIS WAY →', 0, -318);
    ctx.restore();
  }
}
