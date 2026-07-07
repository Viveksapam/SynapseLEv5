import { makeSnowflake, makeEmber } from './particleFactories';

const drawFirefly = (ctx, p) => {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  const objGrd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
  objGrd.addColorStop(0, p.color);
  objGrd.addColorStop(1, 'rgba(100,255,100,0)');
  ctx.fillStyle = objGrd;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawSnow = (ctx, p) => {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = p.opacity * 0.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawEmber = (ctx, p) => {
  ctx.save();
  ctx.globalAlpha = p.opacity * 0.9;
  const objGrd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
  objGrd.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 1)`);
  objGrd.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
  ctx.fillStyle = objGrd;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawDust = (ctx, p) => {
  ctx.save();
  ctx.globalAlpha = p.opacity * (0.7 + 0.3 * Math.sin(p.phase));
  ctx.fillStyle = 'rgba(200,220,255,0.8)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const updateAndDrawParticles = (ctx, arrParticles, numW, numH) => {
  for (let i = arrParticles.length - 1; i >= 0; i--) {
    const p = arrParticles[i];

    if (p.type === 'firefly') {
      p.phase += p.phaseSpeed;
      p.x += p.vx + Math.sin(p.phase * 1.3) * 0.4;
      p.y += p.vy + Math.cos(p.phase) * 0.3;
      p.opacity = p.maxOpacity * (0.5 + 0.5 * Math.sin(p.phase));
      if (p.x < 0) p.x = numW; if (p.x > numW) p.x = 0;
      if (p.y < 0) p.y = numH; if (p.y > numH) p.y = 0;
      drawFirefly(ctx, p);
    } else if (p.type === 'snow') {
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.speedY;
      if (p.y > numH + 10) { arrParticles[i] = { type: 'snow', ...makeSnowflake(numW) }; continue; }
      drawSnow(ctx, p);
    } else if (p.type === 'ember') {
      p.x += p.vx; p.y += p.vy; p.life -= 0.008; p.opacity = p.life;
      if (p.life <= 0) { arrParticles[i] = { type: 'ember', ...makeEmber(numW, numH) }; continue; }
      drawEmber(ctx, p);
    } else if (p.type === 'dust') {
      p.phase += 0.008;
      p.x += p.vx + Math.sin(p.phase) * 0.08;
      p.y += p.vy;
      if (p.y < -10) p.y = numH + 10;
      if (p.y > numH + 10) p.y = -10;
      if (p.x < -10) p.x = numW + 10;
      if (p.x > numW + 10) p.x = -10;
      drawDust(ctx, p);
    }
  }
};
