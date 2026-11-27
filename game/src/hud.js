// hud.js — the heads-up display and the menu screens. The HUD is the densest
// part of every screenshot: level name, objective, exit progress, score,
// distance, timer, lives, corn, dash meter and Farmer Joe's state.

import { ESCAPE_DISTANCE_M, VIEW_W, VIEW_H } from './config.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

// The logical rect covering the whole canvas, including the letterbox bands
// around the 1280x720 view, so overlays tint edge to edge.
function fullRect(game) {
  const s = game.viewScale || 1;
  return {
    x: -(game.viewOffsetX || 0) / s,
    y: -(game.viewOffsetY || 0) / s,
    w: game.canvas.width / s,
    h: game.canvas.height / s,
  };
}

function chip(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

function heart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#E74C3C' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-12, -2, -7, -11, 0, -5);
  ctx.bezierCurveTo(7, -11, 12, -2, 0, 8);
  ctx.fill();
  ctx.restore();
}

export function drawHud(ctx, game) {
  const { state, score, distanceM, elapsed, lives, corn, combo } = game;
  const level = game.world.level();
  const W = VIEW_W;
  const H = VIEW_H;
  const barH = 62;

  // Top bar.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.82)';
  ctx.fillRect(0, 0, W, barH);
  ctx.fillStyle = '#F1C40F';
  ctx.fillRect(0, barH, W, 3);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('GOBBLE DASH', 14, 20);
  ctx.fillStyle = '#F5B041';
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('a turkey escape', 14, 44);

  // Level chip + objective.
  ctx.fillStyle = '#7D3C98';
  ctx.beginPath();
  ctx.roundRect(210, 8, 250, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText(level.name, 220, 20);
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `13px ${FONT}`;
  ctx.fillText('OBJECTIVE: Reach the forest gate — don\'t be dinner!', 218, 46);

  // Exit progress bar.
  const barX = 480;
  const barW = Math.min(340, W - barX - 430);
  const progress = Math.min(1, distanceM / ESCAPE_DISTANCE_M);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(barX, 14, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#58D68D';
  ctx.beginPath();
  ctx.roundRect(barX, 14, Math.max(16, barW * progress), 16, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `EXIT ${Math.max(0, Math.ceil(ESCAPE_DISTANCE_M - distanceM))}m to go`,
    barX + barW / 2, 22,
  );
  // Turkey marker on the bar, farmer marker behind it.
  const markerX = barX + barW * progress;
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.arc(markerX, 22, 7, 0, Math.PI * 2);
  ctx.fill();
  const farmerX = barX + barW * Math.max(0, progress - game.farmer.gap / 9000);
  ctx.fillStyle = '#E74C3C';
  ctx.beginPath();
  ctx.arc(farmerX, 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';

  // Score, distance, timer, lives, corn — right side.
  const right = W - 14;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(`SCORE ${Math.floor(score).toLocaleString('en-US')}`, right, 18);
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillStyle = '#AED6F1';
  const mm = Math.floor(elapsed / 60);
  const ss = Math.floor(elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`${Math.floor(distanceM)}m   ${mm}:${ss}`, right, 42);
  // Lives.
  for (let i = 0; i < 3; i++) heart(ctx, right - 180 - i * 26, 16, i < lives);
  ctx.fillStyle = '#F1C40F';
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`CORN x${corn}`, right - 250, 16);
  if (combo > 1) {
    ctx.fillStyle = '#F39C12';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(`COMBO x${combo}`, right - 250, 40);
  }

  // Farmer state chip, under the bar on the left.
  const fState = game.farmer.state;
  const fColor = fState === 'HUNTING' ? '#C0392B' : fState === 'SUSPICIOUS' ? '#CA6F1E' : '#5D6D7E';
  chip(ctx, 14, barH + 10, 268, 30, 'rgba(30, 18, 8, 0.78)');
  ctx.fillStyle = fColor;
  ctx.beginPath();
  ctx.arc(32, barH + 25, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`FARMER JOE — ${fState}${fState === 'HUNTING' ? '!' : ''}`, 48, barH + 26);
  // Alert meter.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(14, barH + 46, 268, 8, 4);
  ctx.fill();
  ctx.fillStyle = fColor;
  ctx.beginPath();
  ctx.roundRect(14, barH + 46, 268 * game.farmer.angry, 8, 4);
  ctx.fill();

  // Dash meter, bottom-left.
  const dashY = VIEW_H - 34;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.7)';
  ctx.beginPath();
  ctx.roundRect(14, dashY - 8, 190, 20, 8);
  ctx.fill();
  ctx.fillStyle = game.turkey.dashMeter > 25 ? '#58D68D' : '#E74C3C';
  ctx.beginPath();
  ctx.roundRect(16, dashY - 6, 186 * (game.turkey.dashMeter / 100), 16, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('DASH [SHIFT]', 214, dashY + 2);

  // Controls hint, bottom-right.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `13px ${FONT}`;
  ctx.fillText('SPACE jump  •  S slide  •  SHIFT dash  •  P pause  •  M mute', W - 14, dashY + 2);
  ctx.textAlign = 'left';

  // Level banner (shows briefly after a level change).
  if (game.bannerTimer > 0) {
    const alpha = Math.min(1, game.bannerTimer);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30, 18, 8, 0.85)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 260, 150, 520, 74, 12);
    ctx.fill();
    ctx.fillStyle = '#F1C40F';
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(game.bannerText, W / 2, 178);
    ctx.fillStyle = '#FDEBD0';
    ctx.font = `16px ${FONT}`;
    ctx.fillText(game.bannerSub, W / 2, 206);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Damage flash.
  if (game.world.flash > 0) {
    ctx.fillStyle = `rgba(231, 76, 60, ${game.world.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// Big centred button; returns its rect so main.js can hit-test clicks.
export function drawButton(ctx, label, cx, cy, w, h, hot = false) {
  ctx.fillStyle = hot ? '#F39C12' : '#E67E22';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 1);
  ctx.textAlign = 'left';
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function drawTitle(ctx, game) {
  const W = VIEW_W;
  const H = VIEW_H;
  const full = fullRect(game);
  ctx.fillStyle = 'rgba(30, 18, 8, 0.55)';
  ctx.fillRect(full.x, full.y, full.w, full.h);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F1C40F';
  ctx.font = `bold 84px ${FONT}`;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  ctx.strokeText('GOBBLE DASH', W / 2, 150);
  ctx.fillText('GOBBLE DASH', W / 2, 150);
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText("A turkey's great Thanksgiving escape", W / 2, 200);

  // The cast, drawn big: Giblet the turkey and Farmer Joe. Both draw at
  // their own world position, so park them at the origin for the portrait.
  const savedTurkey = { x: game.turkey.x, y: game.turkey.y };
  game.turkey.x = 0;
  game.turkey.y = 0;
  ctx.save();
  ctx.translate(W / 2 - 260, 430);
  ctx.scale(1.9, 1.9);
  game.turkey.draw(ctx, 0);
  ctx.restore();
  game.turkey.x = savedTurkey.x;
  game.turkey.y = savedTurkey.y;
  const savedFarmer = { y: game.farmer.y, turkeyX: game.farmer.turkeyX, gap: game.farmer.gap };
  game.farmer.y = 0;
  game.farmer.turkeyX = 0;
  game.farmer.gap = 0;
  ctx.save();
  ctx.translate(W / 2 + 260, 430);
  ctx.scale(1.25, 1.25);
  game.farmer.draw(ctx, 0, false);
  ctx.restore();
  game.farmer.y = savedFarmer.y;
  game.farmer.turkeyX = savedFarmer.turkeyX;
  game.farmer.gap = savedFarmer.gap;
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText('GIBLET THE TURKEY', W / 2 - 260, 458);
  ctx.fillText('FARMER JOE', W / 2 + 260, 458);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `19px ${FONT}`;
  ctx.fillText('Joe wants turkey for Thanksgiving dinner. Run 1,800m through the', W / 2, 500);
  ctx.fillText('farmyard, the barn and the kitchen — dodge the oven and the knives!', W / 2, 526);

  ctx.fillStyle = '#F5B041';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('SPACE / ↑ jump    S / ↓ slide    SHIFT dash    A / D drift    P pause    M mute', W / 2, 562);
  if (game.best > 0) {
    ctx.fillStyle = '#F1C40F';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText(`BEST SCORE: ${game.best.toLocaleString('en-US')}`, W / 2, 592);
  }
  const pulse = 0.7 + 0.3 * Math.sin(game.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('PRESS SPACE OR CLICK START TO RUN!', W / 2, 624);
  ctx.globalAlpha = 1;
  game.titleButton = drawButton(ctx, '▶  START THE ESCAPE', W / 2, 676, 320, 52);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, game) {
  const W = VIEW_W;
  const H = VIEW_H;
  const full = fullRect(game);
  const escaped = game.endKind === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 60, 25, 0.72)' : 'rgba(60, 12, 8, 0.72)';
  ctx.fillRect(full.x, full.y, full.w, full.h);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#58D68D' : '#E74C3C';
  ctx.font = `bold 72px ${FONT}`;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  ctx.strokeText(title, W / 2, 180);
  ctx.fillText(title, W / 2, 180);
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText(
    escaped
      ? 'Giblet slipped through the forest gate. No turkey dinner tonight!'
      : 'Farmer Joe got his turkey… this time. Dinner is served — for Joe.',
    W / 2, 232,
  );

  // Score card.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.85)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 240, 270, 480, 210, 14);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 22px ${FONT}`;
  const rows = [
    ['FINAL SCORE', Math.floor(game.score).toLocaleString('en-US')],
    ['DISTANCE', `${Math.floor(game.distanceM)}m of 1,800m`],
    ['CORN COLLECTED', `${game.corn}`],
    ['TIME', `${Math.floor(game.elapsed / 60)}:${Math.floor(game.elapsed % 60).toString().padStart(2, '0')}`],
    ['BEST SCORE', game.best.toLocaleString('en-US')],
  ];
  rows.forEach(([label, value], i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F5B041';
    ctx.fillText(label, W / 2 - 210, 306 + i * 36);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(value, W / 2 + 210, 306 + i * 36);
  });
  ctx.textAlign = 'center';
  if (game.score >= game.best && game.score > 0) {
    ctx.fillStyle = '#F1C40F';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('★ NEW BEST SCORE! ★', W / 2, 500);
  }
  game.endButton = drawButton(ctx, '↻  RUN AGAIN  (R)', W / 2, 560, 300, 52);
  ctx.fillStyle = '#FDEBD0';
  ctx.font = `16px ${FONT}`;
  ctx.fillText('or press R — the farm is still hungry', W / 2, 606);
  ctx.textAlign = 'left';
}

export function drawPaused(ctx, game) {
  const W = VIEW_W;
  const H = VIEW_H;
  const full = fullRect(game);
  ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
  ctx.fillRect(full.x, full.y, full.w, full.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillText('PAUSED', W / 2, H / 2 - 20);
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Press P to keep running — Joe is catching his breath too.', W / 2, H / 2 + 24);
  ctx.textAlign = 'left';
}
