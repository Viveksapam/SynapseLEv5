const rand = (numMin, numMax) => Math.random() * (numMax - numMin) + numMin;

export const makeFirefly = (numW, numH) => ({
  x: rand(0, numW), y: rand(numH * 0.2, numH),
  vx: rand(-0.4, 0.4), vy: rand(-0.3, 0.3),
  size: rand(1.5, 3.5),
  opacity: 0, maxOpacity: rand(0.4, 0.9),
  phase: rand(0, Math.PI * 2), phaseSpeed: rand(0.015, 0.04),
  color: `hsl(${rand(60, 120)}, 100%, 70%)`,
});

export const makeSnowflake = (numW) => ({
  x: rand(-20, numW + 20), y: rand(-20, -1),
  size: rand(2, 6),
  speedY: rand(1.2, 3.5), speedX: rand(-1.5, 1.5),
  opacity: rand(0.4, 0.9),
  wobble: rand(0, Math.PI * 2),
  wobbleSpeed: rand(0.01, 0.04), wobbleAmp: rand(0.3, 1.5),
});

export const makeEmber = (numW, numH) => ({
  x: rand(numW * 0.1, numW * 0.9), y: numH + rand(0, 20),
  size: rand(1.5, 4),
  vx: rand(-0.6, 0.6), vy: rand(-1.2, -2.8),
  opacity: rand(0.6, 1), hue: rand(15, 45), life: rand(0.6, 1),
});

export const makeDustMote = (numW, numH) => ({
  x: rand(0, numW), y: rand(0, numH),
  size: rand(0.8, 2),
  vx: rand(-0.15, 0.15), vy: rand(-0.08, 0.1),
  opacity: rand(0.1, 0.35),
  phase: rand(0, Math.PI * 2),
});

export const initParticlesForTheme = (strTheme, numW, numH) => {
  const arrParticles = [];
  switch (strTheme) {
    case 'summer':
    case 'halloween':
      for (let i = 0; i < 25; i++) arrParticles.push({ type: 'dust', ...makeDustMote(numW, numH) });
      break;
    case 'night':
      for (let i = 0; i < 40; i++) arrParticles.push({ type: 'firefly', ...makeFirefly(numW, numH) });
      for (let i = 0; i < 20; i++) arrParticles.push({ type: 'dust', ...makeDustMote(numW, numH) });
      break;
    case 'christmas':
    case 'winter':
      for (let i = 0; i < 60; i++) arrParticles.push({ type: 'snow', ...makeSnowflake(numW) });
      if (strTheme === 'christmas') {
        for (let i = 0; i < 20; i++) arrParticles.push({ type: 'ember', ...makeEmber(numW, numH) });
      }
      break;
    default:
      for (let i = 0; i < 40; i++) arrParticles.push({ type: 'dust', ...makeDustMote(numW, numH) });
  }
  return arrParticles;
};
