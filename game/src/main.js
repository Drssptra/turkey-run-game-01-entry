// main.js — Gobble Dash: the game loop, the state machine (title / playing /
// paused / end), collisions, scoring, and the deterministic ?shot= poses
// and ?selftest=1 used for screenshots and verification.

import { VIEW_W, VIEW_H, GROUND_Y, ESCAPE_DISTANCE_M, INVULN_TIME, FARMER, PICKUPS, OBSTACLES, BEST_KEY, LEVELS } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World } from './world.js';
import { drawObstacles, drawPickups, drawKnives, drawParticles, drawFloaters } from './render.js';
import { drawHud, drawButton, drawTitle, drawEnd, drawPaused } from './hud.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || 1);
const SELFTEST = params.get('selftest') === '1';

window.addEventListener('error', (event) => {
  document.title = `PAGEERROR: ${event.message}`;
});

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sounds = new SoundBank();
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World();
    this.state = 'title';
    this.endKind = null;
    this.score = 0;
    this.distanceM = 0;
    this.elapsed = 0;
    this.lives = 3;
    this.corn = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.time = 0;
    this.bannerTimer = 0;
    this.bannerText = '';
    this.bannerSub = '';
    this.titleButton = null;
    this.endButton = null;
    this.frozen = false;
    this.selftestLog = [];
    this.selftestDone = false;
    this.shakeX = 0;
    this.shakeY = 0;
    this.hitLog = [];

    this.input.onKey = (code) => {
      this.sounds.unlock();
      if (code === 'KeyM') this.sounds.toggleMute();
      if (code === 'KeyP' && (this.state === 'playing' || this.state === 'paused')) {
        this.state = this.state === 'playing' ? 'paused' : 'playing';
      }
      if (code === 'KeyR' && this.state === 'end') this.startRun();
      if ((code === 'Space' || code === 'Enter') && this.state === 'title') this.startRun();
    };
    this.input.onClick = (x, y) => {
      this.sounds.unlock();
      const logical = this.toLogical(x, y);
      if (this.state === 'title' && this.titleButton && this.inside(logical, this.titleButton)) {
        this.sounds.click();
        this.startRun();
      } else if (this.state === 'end' && this.endButton && this.inside(logical, this.endButton)) {
        this.sounds.click();
        this.startRun();
      }
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());

    if (SHOT) {
      applyShot(this, SHOT, SEED);
    } else if (SELFTEST) {
      this.runSelftest();
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const scale = Math.min(this.canvas.width / VIEW_W, this.canvas.height / VIEW_H);
    this.viewScale = scale;
    this.viewOffsetX = (this.canvas.width - VIEW_W * scale) / 2;
    this.viewOffsetY = (this.canvas.height - VIEW_H * scale) / 2;
  }

  toLogical(x, y) {
    return {
      x: (x - this.viewOffsetX) / this.viewScale,
      y: (y - this.viewOffsetY) / this.viewScale,
    };
  }

  inside(point, rect) {
    return (
      point.x >= rect.x && point.x <= rect.x + rect.w &&
      point.y >= rect.y && point.y <= rect.y + rect.h
    );
  }

  startRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset(SEED + Date.now() % 1000);
    this.state = 'playing';
    this.endKind = null;
    this.score = 0;
    this.distanceM = 0;
    this.elapsed = 0;
    this.lives = 3;
    this.corn = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.showBanner('LEVEL 1 — FARMYARD', 'Run! Joe is right behind you!');
    this.sounds.gobble();
  }

  showBanner(text, sub) {
    this.bannerText = text;
    this.bannerSub = sub;
    this.bannerTimer = 2.4;
  }

  endRun(kind) {
    this.state = 'end';
    this.endKind = kind;
    if (this.score > this.best) {
      this.best = Math.floor(this.score);
      localStorage.setItem(BEST_KEY, String(this.best));
    }
    if (kind === 'escaped') this.sounds.winJingle();
    else this.sounds.caught();
  }

  hurt(source) {
    if (this.turkey.invuln > 0 || this.state !== 'playing') return;
    this.hitLog.push(`${source}@${Math.floor(this.distanceM)}m`);
    this.lives -= 1;
    this.turkey.invuln = INVULN_TIME;
    this.combo = 0;
    this.world.shake = 1;
    this.world.flash = 1;
    this.world.burst(this.turkey.x, this.turkey.y - 40, '#E74C3C', 18);
    this.farmer.stumble(FARMER.hitPenalty);
    this.sounds.hurt();
    if (this.lives <= 0) {
      this.turkey.dead = true;
      this.endRun('caught');
    }
  }

  update(dt) {
    this.time += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.state !== 'playing' || this.frozen) {
      // Title and end screens still animate their background.
      if (this.state === 'title' || this.state === 'end') {
        this.world.scrollX += 12 * dt;
      }
      return;
    }

    this.elapsed += dt;
    const turkey = this.turkey;
    turkey.update(dt, this.input);

    if (turkey.jumpQueued) {
      turkey.jumpQueued = false;
      this.sounds.jump();
    }
    if (turkey.dashQueued) {
      turkey.dashQueued = false;
      this.sounds.dash();
      this.world.burst(turkey.x - 20, turkey.y - 30, '#FDEBD0', 8);
    }

    this.world.update(dt, turkey, this.farmer, (event) => {
      if (event.type === 'level') {
        this.showBanner(event.level.name, event.level.index === 1 ? 'Into the barn — watch for knives!' : 'The kitchen! Mind the oven!');
        this.sounds.alarm();
      }
      if (event.type === 'knife') this.sounds.knifeThrow();
      if (event.type === 'gate') this.showBanner('THE FOREST GATE!', 'Almost free — keep running!');
    });

    const speed = this.world.speed * turkey.speedMultiplier;
    this.distanceM = this.world.distanceM;
    this.score += speed * dt * 0.12;

    this.farmer.update(dt, turkey.x, this.world.speed, turkey);
    if (this.farmer.stateChanged) {
      this.farmer.stateChanged = false;
      if (this.farmer.state === 'HUNTING') this.sounds.alarm();
    }

    // Farmer catches the turkey.
    if (this.farmer.gap <= FARMER.catchGap) {
      this.farmer.catchTurkey();
      this.world.floater(turkey.x, turkey.y - 110, 'CAUGHT! -1 LIFE', '#E74C3C');
      this.hurt('farmer');
    }

    // Collisions with obstacles.
    const tBox = turkey.box();
    for (const o of this.world.obstacles) {
      const oBox = this.world.obstacleBox(o);
      if (this.overlap(tBox, oBox)) {
        if (o.kind === 'puddle') {
          if (turkey.onGround && turkey.slowTimer <= 0) {
            turkey.slowTimer = 0.6;
            this.world.floater(turkey.x, turkey.y - 100, 'GRAVY! SLOW!', '#F1C40F');
          }
        } else if (o.kind === 'branch' && turkey.sliding) {
          // Slid clean under it.
        } else {
          this.hurt(o.kind);
          // Shove the turkey past the obstacle so one hit cannot repeat.
          o.x -= 160;
          break;
        }
      }
    }

    // Thrown knives.
    for (const k of this.world.knives) {
      if (this.overlap(tBox, this.world.knifeBox(k))) {
        if (turkey.sliding) {
          this.world.floater(turkey.x, turkey.y - 100, 'DUCKED IT!', '#58D68D');
          k.x = -100;
        } else {
          this.hurt('knife');
          k.x = -100;
          break;
        }
      }
    }

    // Pickups.
    for (const p of this.world.pickups) {
      if (this.overlap(tBox, this.world.pickupBox(p))) {
        const def = PICKUPS[p.kind];
        this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
        this.comboTimer = 2;
        const gained = def.score * Math.min(this.combo, 5);
        this.score += gained;
        if (p.kind === 'corn') this.corn += 1;
        if (p.kind === 'feather') turkey.dashMeter = 100;
        this.world.burst(p.x, p.y, '#F1C40F', 10);
        this.world.floater(p.x, p.y - 30, `${def.label}${this.combo > 1 ? ` x${Math.min(this.combo, 5)}` : ''}`, '#FDEBD0');
        this.sounds.pickup(this.combo);
        p.x = -100;
        if (this.corn > 0 && this.corn % 10 === 0 && p.kind === 'corn') {
          this.world.floater(turkey.x, turkey.y - 120, '10 CORN! +250 BONUS', '#F1C40F');
          this.score += 250;
        }
      }
    }

    // Escape!
    if (this.world.escaping && this.world.gateX !== null && turkey.x + 30 >= this.world.gateX - 40) {
      this.endRun('escaped');
    }

    // Screen shake decay.
    this.shakeX = (Math.random() - 0.5) * this.world.shake * 8;
    this.shakeY = (Math.random() - 0.5) * this.world.shake * 8;
  }

  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const pal = this.world.level().palette;

    // Bleed fill: the letterbox bands around the 1280x720 view match the scene.
    const groundScreenY = this.viewOffsetY + GROUND_Y * this.viewScale;
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, groundScreenY));
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, Math.max(0, groundScreenY));
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, Math.max(0, groundScreenY), cw, ch);

    ctx.save();
    ctx.translate(this.viewOffsetX + this.shakeX, this.viewOffsetY + this.shakeY);
    ctx.scale(this.viewScale, this.viewScale);

    this.world.drawBackground(ctx, this.time);
    this.world.drawGate(ctx);
    drawObstacles(ctx, this.world, this.time);
    drawPickups(ctx, this.world);
    drawKnives(ctx, this.world);
    // The world turkey and farmer only run in the game itself; the title
    // and end screens draw their own portraits and cards.
    if (this.state === 'playing' || this.state === 'paused') {
      this.farmer.draw(ctx, this.time);
      this.turkey.draw(ctx, this.time);
    }
    drawParticles(ctx, this.world);
    drawFloaters(ctx, this.world);

    if (this.state === 'playing' || this.state === 'paused') drawHud(ctx, this);
    if (this.state === 'title') drawTitle(ctx, this);
    if (this.state === 'end') drawEnd(ctx, this);
    if (this.state === 'paused') drawPaused(ctx, this);

    ctx.restore();
  }

  frame(dt) {
    this.update(dt);
    this.render();
    this.input.endFrame();
  }

  // ?selftest=1 — drives the real game with scripted keys over 240 fixed
  // frames and reports the result into the document title, so a headless
  // run can verify play works without depending on animation frames.
  runSelftest() {
    const log = (line) => {
      this.selftestLog.push(line);
      document.title = `SELFTEST: ${this.selftestLog.join(' | ')}`;
    };
    log('boot');
    this.startRun();
    log('started');
    // Reactive autopilot: a competent player that jumps when a jumpable
    // obstacle is close, slides under branches and thrown knives, and
    // dashes when Farmer Joe is hunting close behind.
    const held = new Set();
    try {
      for (let frame = 0; frame < 3600; frame++) {
        const turkey = this.turkey;
        const ahead = this.world.obstacles
          .filter((o) => o.x > turkey.x - 10 && o.x < turkey.x + 300)
          .sort((a, b) => a.x - b.x)[0];
        const knife = this.world.knives
          .filter((k) => k.x > turkey.x - 10 && k.x < turkey.x + 320)
          .sort((a, b) => a.x - b.x)[0];
        const tap = [];
        if (ahead) {
          const dist = ahead.x - turkey.x;
          if (ahead.kind !== 'branch' && dist < 165 && turkey.onGround) tap.push('Space');
        }
        if (this.farmer.state === 'HUNTING' && this.farmer.gap < 80 && turkey.dashMeter > 30) {
          tap.push('ShiftLeft');
        }
        // Hold slide while a branch or a thrown knife is passing overhead.
        const branchNear = ahead && ahead.kind === 'branch' && ahead.x - turkey.x < 170 && ahead.x > turkey.x - 80;
        const knifeNear = knife && knife.x - turkey.x < 220 && knife.x > turkey.x - 50;
        const wantSlide = Boolean(branchNear || knifeNear);
        if (wantSlide && !held.has('ArrowDown')) {
          this.input.fakeKey('ArrowDown');
          held.add('ArrowDown');
        }
        if (!wantSlide && held.has('ArrowDown')) {
          this.input.fakeKeyUp('ArrowDown');
          held.delete('ArrowDown');
        }
        for (const code of tap) this.input.fakeKey(code);
        this.update(1 / 60);
        this.render();
        this.input.endFrame();
        for (const code of tap) this.input.fakeKeyUp(code);
        if (this.state === 'end') break;
      }
      const ok =
        (this.state === 'playing' && this.distanceM > 300) ||
        (this.state === 'end' && this.endKind === 'escaped');
      log(
        `state=${this.state} distance=${this.distanceM.toFixed(1)}m score=${Math.floor(this.score)} ` +
        `lives=${this.lives} obstacles=${this.world.obstacles.length} pickups=${this.world.pickups.length} ` +
        `farmer=${this.farmer.state} gap=${Math.floor(this.farmer.gap)} hits=[${this.hitLog.join(',')}] ${ok ? 'PASS' : 'FAIL'}`,
      );
    } catch (err) {
      log(`ERROR ${err.message}`);
    }
    const div = document.createElement('div');
    div.id = 'selftest';
    div.textContent = document.title;
    document.body.appendChild(div);
    this.selftestDone = true;
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game;

if (!SELFTEST) {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.frame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
