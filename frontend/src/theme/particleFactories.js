export const snowInit = (numW, numH) =>
  Array.from({ length: 200 }, () => ({
    x: Math.random() * numW, y: Math.random() * numH,
    r: 1 + Math.random() * 3, speed: 0.4 + Math.random() * 1.2,
    drift: (Math.random() - 0.5) * 0.4, opacity: 0.4 + Math.random() * 0.6,
  }));

export const emberInit = (numW, numH) =>
  Array.from({ length: 80 }, () => ({
    x: numW / 2 + (Math.random() - 0.5) * 120, y: numH + 10,
    vx: (Math.random() - 0.5) * 1.5, vy: -(0.5 + Math.random() * 2.5),
    life: Math.random(), maxLife: 0.6 + Math.random() * 0.4,
    size: 1.5 + Math.random() * 3, hue: 15 + Math.random() * 30,
  }));

export const confettiInit = (numW, numH) =>
  Array.from({ length: 150 }, () => ({
    x: Math.random() * numW, y: -20 - Math.random() * numH,
    w: 6 + Math.random() * 8, h: 3 + Math.random() * 5,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    speed: 1 + Math.random() * 3, drift: (Math.random() - 0.5) * 1.5,
    color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`,
  }));

export const batInit = (numW, numH) =>
  Array.from({ length: 18 }, () => ({
    x: Math.random() * numW, y: Math.random() * numH * 0.7,
    speed: 0.4 + Math.random() * 0.8,
    dir: Math.random() > 0.5 ? 1 : -1,
    flapPhase: Math.random() * Math.PI * 2,
    size: 12 + Math.random() * 16,
    opacity: 0.5 + Math.random() * 0.4,
  }));

export const diwaliInit = (numW, numH) =>
  Array.from({ length: 120 }, () => ({
    x: Math.random() * numW, y: Math.random() * numH,
    vx: (Math.random() - 0.5) * 0.8, vy: -(0.3 + Math.random() * 0.8),
    size: 1 + Math.random() * 3, hue: 30 + Math.random() * 40,
    life: Math.random(), maxLife: 0.7 + Math.random() * 0.3,
    twinkleOffset: Math.random() * Math.PI * 2,
  }));
