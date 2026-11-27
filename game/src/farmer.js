// farmer.js — Farmer Joe. He patrols, gets suspicious, then hunts. His state
// is always visible: a label above his head and an alert meter in the HUD.
// He never leaves the screen; when he catches the turkey the turkey loses
// a life and Joe falls back to reset the chase.

import { GROUND_Y, FARMER } from './config.js';

export const FARMER_STATES = {
  PATROL: 'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  HUNTING: 'HUNTING',
};

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = FARMER.startGap;
    this.state = FARMER_STATES.PATROL;
    this.stateTimer = 0;
    this.runCycle = 0;
    this.y = GROUND_Y;
    this.angry = 0;
  }

  get x() {
    // Joe's screen position follows the gap behind the turkey.
    return this.turkeyX - this.gap;
  }

  update(dt, turkeyX, worldSpeed, turkey) {
    this.turkeyX = turkeyX;
    this.stateTimer += dt;
    this.runCycle += dt * 11;

    // State from the gap: close in and he hunts; fall behind and he calms.
    const next =
      this.gap <= FARMER.huntingAt
        ? FARMER_STATES.HUNTING
        : this.gap <= FARMER.suspiciousAt
          ? FARMER_STATES.SUSPICIOUS
          : FARMER_STATES.PATROL;
    if (next !== this.state) {
      this.state = next;
      this.stateTimer = 0;
      this.stateChanged = true;
    }

    const factor =
      this.state === FARMER_STATES.HUNTING
        ? FARMER.huntingSpeed
        : this.state === FARMER_STATES.SUSPICIOUS
          ? FARMER.suspiciousSpeed
          : FARMER.patrolSpeed;

    // Gap moves by relative speed: the world scrolls at worldSpeed, Joe
    // runs at worldSpeed * factor. Dashing pulls away, gravy lets him in.
    let gapDelta = (worldSpeed - worldSpeed * factor) * dt;
    if (turkey.dashing) gapDelta += worldSpeed * 0.5 * dt;
    if (turkey.slowTimer > 0) gapDelta -= worldSpeed * 0.3 * dt;
    this.gap = Math.max(0, Math.min(FARMER.maxGap, this.gap + gapDelta));
    this.angry = Math.max(0, Math.min(1, 1 - this.gap / 320));
  }

  // Called when Joe touches the turkey.
  catchTurkey() {
    this.gap = FARMER.resetGap;
    this.state = FARMER_STATES.PATROL;
    this.stateTimer = 0;
  }

  stumble(amount) {
    this.gap = Math.max(0, this.gap - amount);
  }

  fallBehind(amount) {
    this.gap = Math.min(FARMER.maxGap, this.gap + amount);
  }

  box() {
    return { x: this.x - 26, y: this.y - 96, w: 52, h: 96 };
  }

  draw(ctx, time, showLabel = true) {
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.translate(x, y);

    const legSwing = Math.sin(this.runCycle) * 11;
    const bob = Math.abs(Math.sin(this.runCycle)) * -3;
    ctx.translate(0, bob);

    // Legs: blue overalls.
    ctx.strokeStyle = '#2C4A6B';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -48);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -48);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    // Body: red plaid shirt under blue overalls.
    ctx.fillStyle = '#B03A2E';
    ctx.beginPath();
    ctx.roundRect(-20, -88, 40, 44, 8);
    ctx.fill();
    ctx.strokeStyle = '#7B241C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -70);
    ctx.lineTo(20, -70);
    ctx.moveTo(0, -88);
    ctx.lineTo(0, -44);
    ctx.stroke();
    ctx.fillStyle = '#3A6EA5';
    ctx.fillRect(-16, -78, 32, 34);
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(-14, -62, 6, 6);
    ctx.fillRect(8, -62, 6, 6);

    // Arm reaching forward, carving knife in hand when hunting.
    const reach = this.state === FARMER_STATES.HUNTING ? 16 : 8;
    ctx.strokeStyle = '#B03A2E';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(12, -80);
    ctx.lineTo(26 + reach, -64);
    ctx.stroke();
    if (this.state !== FARMER_STATES.PATROL) {
      // Carving knife: silver blade flashing.
      ctx.save();
      ctx.translate(30 + reach, -66);
      ctx.rotate(-0.5 + Math.sin(time * 6) * 0.08);
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(-4, -3, 10, 6);
      ctx.fillStyle = '#D5D8DC';
      ctx.beginPath();
      ctx.moveTo(6, -4);
      ctx.lineTo(34, -1.5);
      ctx.lineTo(6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Head.
    ctx.fillStyle = '#F5CBA7';
    ctx.beginPath();
    ctx.arc(2, -100, 13, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyebrows.
    ctx.strokeStyle = '#4A2C14';
    ctx.lineWidth = 3;
    const brow = this.state === FARMER_STATES.HUNTING ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(6, -108 + brow);
    ctx.lineTo(14, -104);
    ctx.stroke();
    // Eye.
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(10, -101, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Moustache.
    ctx.fillStyle = '#7B3F00';
    ctx.beginPath();
    ctx.ellipse(8, -93, 8, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = '#E8C96A';
    ctx.beginPath();
    ctx.ellipse(2, -110, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, -114, 12, 8, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#B7950B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(2, -110, 20, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // State label above his head (hidden in the title-screen portrait).
    if (!showLabel) {
      ctx.restore();
      return;
    }
    const label =
      this.state === FARMER_STATES.HUNTING
        ? 'FARMER JOE — HUNTING!'
        : this.state === FARMER_STATES.SUSPICIOUS
          ? 'FARMER JOE — SUSPICIOUS…'
          : 'FARMER JOE — PATROL';
    const color =
      this.state === FARMER_STATES.HUNTING
        ? '#E74C3C'
        : this.state === FARMER_STATES.SUSPICIOUS
          ? '#E67E22'
          : '#5D6D7E';
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(label).width + 14;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.78)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -148, w, 22, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -137);
    if (this.state === FARMER_STATES.HUNTING) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('!', 26, -152 + Math.sin(time * 10) * 2);
    }

    ctx.restore();
  }
}
