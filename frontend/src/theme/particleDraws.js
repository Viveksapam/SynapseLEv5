export const snowDraw = (ctx, numW, numH, arrParticles) => {
  ctx.clearRect(0, 0, numW, numH);
  arrParticles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    ctx.fill();

    p.y += p.speed;
    p.x += p.drift + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.3;
    if (p.y > numH + 5) { p.y = -5; p.x = Math.random() * numW; }
    if (p.x > numW + 5) p.x = -5;
    if (p.x < -5) p.x = numW + 5;
  });
};

export const emberDraw = (ctx, numW, numH, arrParticles) => {
  ctx.clearRect(0, 0, numW, numH);
  arrParticles.forEach((p) => {
    p.life -= 0.008;
    p.x += p.vx + Math.sin(Date.now() * 0.002 + p.y) * 0.3;
    p.y += p.vy;
    p.vy -= 0.015;

    if (p.life <= 0) {
      p.x = numW / 2 + (Math.random() - 0.5) * 120;
      p.y = numH + 10;
      p.life = p.maxLife;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = -(0.5 + Math.random() * 2.5);
    }

    const numAlpha = (p.life / p.maxLife) * 0.85;
    const numScale = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * numScale, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${numAlpha})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * numScale * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${numAlpha * 0.2})`;
    ctx.fill();
  });
};

export const confettiDraw = (ctx, numW, numH, arrParticles) => {
  ctx.clearRect(0, 0, numW, numH);
  arrParticles.forEach((p) => {
    p.y += p.speed; p.x += p.drift; p.rot += p.rotSpeed;
    if (p.y > numH + 20) { p.y = -20; p.x = Math.random() * numW; }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
};

const drawBatWing = (ctx, b, numFlap, numDir) => {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(numDir * b.size * 0.6, numFlap * b.size * 0.4 - b.size * 0.1, numDir * b.size, numFlap * b.size * 0.3, numDir * b.size * 0.8, b.size * 0.3);
  ctx.bezierCurveTo(numDir * b.size * 0.4, b.size * 0.1, numDir * b.size * 0.2, b.size * 0.1, 0, 0);
  ctx.fill();
};

export const batDraw = (ctx, numW, numH, arrBats) => {
  ctx.clearRect(0, 0, numW, numH);
  const numT = Date.now() * 0.003;
  arrBats.forEach((b) => {
    b.x += b.speed * b.dir;
    b.y += Math.sin(numT + b.flapPhase) * 0.5;
    if (b.x > numW + b.size) { b.x = -b.size; b.y = Math.random() * numH * 0.7; }
    if (b.x < -b.size) { b.x = numW + b.size; b.y = Math.random() * numH * 0.7; }

    const numFlap = Math.sin(numT * 6 + b.flapPhase);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.dir, 1);
    ctx.fillStyle = `rgba(60, 10, 80, ${b.opacity})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size * 0.15, b.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(80, 0, 110, ${b.opacity})`;
    drawBatWing(ctx, b, numFlap, -1);
    drawBatWing(ctx, b, numFlap, 1);
    ctx.restore();
  });
};

export const diwaliDraw = (ctx, numW, numH, arrParticles) => {
  ctx.clearRect(0, 0, numW, numH);
  const numT = Date.now() * 0.003;
  arrParticles.forEach((p) => {
    p.life -= 0.004;
    p.x += p.vx + Math.sin(numT + p.twinkleOffset) * 0.3;
    p.y += p.vy;
    if (p.life <= 0 || p.y < -10) {
      p.x = Math.random() * numW; p.y = numH + 10; p.life = p.maxLife;
    }
    const numTwinkle = 0.5 + 0.5 * Math.sin(numT * 5 + p.twinkleOffset);
    const numAlpha = (p.life / p.maxLife) * numTwinkle;

    const objGrd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
    objGrd.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${numAlpha})`);
    objGrd.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = objGrd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${numAlpha * 0.9})`;
    ctx.fill();
  });
};
