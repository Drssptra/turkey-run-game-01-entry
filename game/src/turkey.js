// turkey.js — Giblet, the player. Runs, jumps, slides, dashes, and draws
// itself with a fanned tail, a red wattle and a very determined eye.

import {
  GRAVITY, JUMP_VELOCITY, GROUND_Y, TURKEY_X, TURKEY_MIN_X, TURKEY_MAX_X,
  DASH_MULTIPLIER, DASH_TIME, DASH_MAX, DASH_DRAIN, DASH_REGEN, SLIDE_TIME,
} from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashMeter = DASH_MAX;
    this.runCycle = 0;
    this.facing = 1;
    this.invuln = 0;
    this.slowTimer = 0;
    this.dead = false;
    this.jumpBuffer = 0;
    this.coyoteTimer = 0;
  }

  get width() {
    return this.sliding ? 74 : 56;
  }

  get height() {
    return this.sliding ? 34 : 62;
  }

  get speedMultiplier() {
    let mult = 1;
    if (this.dashing) mult *= DASH_MULTIPLIER;
    if (this.slowTimer > 0) mult *= 0.55;
    return mult;
  }

  update(dt, input) {
    if (this.dead) return;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;

    // Horizontal drift: the turkey can surge ahead or fall back a little.
    if (input.down('ArrowLeft', 'KeyA')) this.x -= 190 * dt;
    if (input.down('ArrowRight', 'KeyD')) this.x += 190 * dt;
    this.x = Math.max(TURKEY_MIN_X, Math.min(TURKEY_MAX_X, this.x));

    // Jump, with a buffer (pressed just before landing still jumps) and
    // coyote time (just ran off a ledge still jumps). Feels fair.
    if (input.hit('Space', 'ArrowUp', 'KeyW')) this.jumpBuffer = 0.12;
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (this.onGround) this.coyoteTimer = 0.09;
    else if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.jumpBuffer > 0 && (this.onGround || this.coyoteTimer > 0) && !this.sliding) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.jumpQueued = true;
    }
    // Slide (duck under branches and thrown knives).
    if (input.hit('ArrowDown', 'KeyS') && this.onGround) {
      this.sliding = true;
      this.slideTimer = SLIDE_TIME;
    }
    if (this.slideTimer > 0) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }
    // Holding slide keeps the turkey low until the hazard has passed.
    if (input.down('ArrowDown', 'KeyS') && this.onGround && this.sliding) {
      this.slideTimer = Math.max(this.slideTimer, 0.15);
    }
    // Dash.
    if (input.hit('ShiftLeft', 'ShiftRight') && this.dashMeter > 25 && !this.dashing) {
      this.dashing = true;
      this.dashTimer = DASH_TIME;
      this.dashQueued = true;
    }
    if (this.dashing) {
      this.dashTimer -= dt;
      this.dashMeter = Math.max(0, this.dashMeter - DASH_DRAIN * dt);
      if (this.dashTimer <= 0 || this.dashMeter <= 0) this.dashing = false;
    } else {
      this.dashMeter = Math.min(DASH_MAX, this.dashMeter + DASH_REGEN * dt);
    }

    // Gravity and ground.
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.runCycle += dt * (this.onGround ? 14 : 6);
  }

  // Axis-aligned box used for collisions (feet at this.y). Inset a little
  // from the drawing so near-misses feel fair.
  box() {
    return {
      x: this.x - this.width / 2 + 5,
      y: this.y - this.height + 3,
      w: this.width - 10,
      h: this.height - 3,
    };
  }

  draw(ctx, time) {
    const blink = this.invuln > 0 && Math.floor(time * 14) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;
    ctx.save();
    ctx.translate(this.x, this.y);

    const legSwing = this.onGround ? Math.sin(this.runCycle) * 9 : 4;
    const bob = this.onGround ? Math.abs(Math.sin(this.runCycle)) * -3 : 0;
    ctx.translate(0, bob);
    if (this.sliding) ctx.scale(1.25, 0.62);

    // Tail feathers, fanned behind.
    const featherColors = ['#C0392B', '#E67E22', '#F1C40F', '#E67E22', '#C0392B'];
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.42;
      ctx.save();
      ctx.translate(-16, -26);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = featherColors[i];
      ctx.beginPath();
      ctx.ellipse(0, -20, 7, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDEBD0';
      ctx.beginPath();
      ctx.ellipse(0, -36, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Legs.
    ctx.strokeStyle = '#E67E22';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(6, -12);
    ctx.lineTo(6 - legSwing, 0);
    ctx.stroke();

    // Body.
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(0, -30, 26, 22, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#6B4226';
    ctx.beginPath();
    ctx.ellipse(-4, -28, 15, 11, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#54331C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-4, -28, 11, 0.4, 2.4);
    ctx.stroke();

    // Neck and head.
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(16, -52, 8, 14, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A9713F';
    ctx.beginPath();
    ctx.arc(20, -64, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak.
    ctx.fillStyle = '#F39C12';
    ctx.beginPath();
    ctx.moveTo(28, -66);
    ctx.lineTo(40, -62);
    ctx.lineTo(28, -58);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.ellipse(26, -56, 4, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye: wide and determined.
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(22, -67, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(23.5, -67, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Little comb.
    ctx.fillStyle = '#C0392B';
    ctx.beginPath();
    ctx.arc(18, -75, 3, 0, Math.PI * 2);
    ctx.arc(22, -76, 3, 0, Math.PI * 2);
    ctx.fill();

    // Dash speed lines.
    if (this.dashing) {
      ctx.strokeStyle = 'rgba(255, 240, 180, 0.8)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const yy = -18 - i * 14;
        ctx.beginPath();
        ctx.moveTo(-34, yy);
        ctx.lineTo(-58 - i * 8, yy);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
