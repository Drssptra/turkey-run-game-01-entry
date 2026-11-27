// render.js — draws everything that lives in the world: obstacles, pickups,
// thrown carving knives, particles and floating score text. The HUD and the
// menu screens live in hud.js; the background lives in world.js.

import { GROUND_Y } from './config.js';

export function drawObstacles(ctx, world, time) {
  for (const o of world.obstacles) {
    ctx.save();
    ctx.translate(o.x, GROUND_Y);
    if (o.kind === 'fence') {
      ctx.fillStyle = '#8A5A30';
      ctx.fillRect(-13, -74, 8, 74);
      ctx.fillRect(5, -74, 8, 74);
      ctx.fillRect(-20, -70, 40, 8);
      ctx.fillRect(-20, -44, 40, 8);
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JUMP!', 0, -82);
    } else if (o.kind === 'haybale') {
      ctx.fillStyle = '#D4AC0D';
      ctx.beginPath();
      ctx.ellipse(0, -29, 34, 29, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9A7D0A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -29, 22, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -29, 10, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.kind === 'puddle') {
      ctx.fillStyle = '#7D6608';
      ctx.beginPath();
      ctx.ellipse(0, -6, 46, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-12, -8, 16, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRAVY! SLOW!', 0, -26);
    } else if (o.kind === 'branch') {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(-36, -92, 72, 12);
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.ellipse(-24, -92, 18, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(0, -96, 20, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(24, -92, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SLIDE!', 0, -110);
    } else if (o.kind === 'trap') {
      ctx.fillStyle = '#7B7D7F';
      ctx.beginPath();
      ctx.roundRect(-28, -26, 56, 26, 5);
      ctx.fill();
      ctx.strokeStyle = '#C0392B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-24, -26);
      ctx.lineTo(0, -40);
      ctx.lineTo(24, -26);
      ctx.stroke();
      ctx.fillStyle = '#F9E79F';
      ctx.beginPath();
      ctx.arc(0, -18, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === 'oven') {
      const flame = o.flame ?? 0.7;
      // The oven: black box, glowing door, flames licking out the top.
      ctx.fillStyle = '#1C1C1C';
      ctx.beginPath();
      ctx.roundRect(-55, -120, 110, 120, 8);
      ctx.fill();
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath();
      ctx.roundRect(-45, -100, 90, 56, 6);
      ctx.fill();
      // Fire inside the oven door.
      const flicker = Math.sin(time * 9 + o.phase) * 6;
      ctx.fillStyle = '#FF7B00';
      ctx.beginPath();
      ctx.ellipse(0, -72, 34, 20 + flicker * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD23F';
      ctx.beginPath();
      ctx.ellipse(0, -68, 20, 12 + flicker * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Flames above the oven.
      for (let i = 0; i < 3; i++) {
        const fx = -30 + i * 30;
        const fh = (26 + Math.sin(time * 11 + o.phase + i * 2) * 8) * flame + 8;
        ctx.fillStyle = i === 1 ? '#FFD23F' : '#FF7B00';
        ctx.beginPath();
        ctx.moveTo(fx - 10, -120);
        ctx.quadraticCurveTo(fx, -120 - fh * 1.6, fx + 10, -120);
        ctx.closePath();
        ctx.fill();
      }
      // Control knobs and a warning sign.
      ctx.fillStyle = '#D5D8DC';
      ctx.beginPath();
      ctx.arc(-28, -110, 5, 0, Math.PI * 2);
      ctx.arc(28, -110, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.roundRect(-34, -146, 68, 22, 5);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOT OVEN!', 0, -135);
    }
    ctx.restore();
  }
}

export function drawPickups(ctx, world) {
  for (const p of world.pickups) {
    const y = p.y + (p.bob || 0);
    ctx.save();
    ctx.translate(p.x, y);
    if (p.kind === 'corn') {
      ctx.fillStyle = '#F1C40F';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 15, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B7950B';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5, -12);
        ctx.lineTo(i * 5, 12);
        ctx.stroke();
      }
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(0, 20);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'pie') {
      ctx.fillStyle = '#D2691E';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(16, 10);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#F5CBA7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(8, -4);
      ctx.moveTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.stroke();
      ctx.fillStyle = '#F5CBA7';
      ctx.beginPath();
      ctx.arc(0, 12, 5, 0, Math.PI);
      ctx.fill();
    } else if (p.kind === 'feather') {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 16, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5DADE2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(6, -14);
      ctx.stroke();
    } else if (p.kind === 'wishbone') {
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(0, 4);
      ctx.lineTo(12, -12);
      ctx.moveTo(0, 4);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.fillStyle = '#FFF9C4';
      ctx.beginPath();
      ctx.arc(-12, -12, 4, 0, Math.PI * 2);
      ctx.arc(12, -12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawKnives(ctx, world) {
  for (const k of world.knives) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.rot);
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-26, -4, 12, 8);
    ctx.fillStyle = '#D5D8DC';
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(26, -2);
    ctx.lineTo(-14, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(26, -2);
    ctx.lineTo(-14, -1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.6);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawFloaters(ctx, world) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
