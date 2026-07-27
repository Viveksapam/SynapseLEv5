import * as THREE from 'three';

export const STAR_COLORS = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#8ab4f8'),
  new THREE.Color('#c58af9'),
  new THREE.Color('#ffe082'),
  new THREE.Color('#24e5af'),
];

export const LIGHT_COLORS = [
  '#3b82f6', '#8b5cf6', '#f472b6',
  '#00f0ff', '#c084fc', '#fbbf24',
];

export const createCircleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
};

export const generateFlyingLightsData = (numCount) =>
  [...Array(numCount)].map((_, i) => ({
    id: i,
    color: LIGHT_COLORS[i % LIGHT_COLORS.length],
    initialZ: -35 + i * (40 / numCount),
    speedZ: 0.04 + Math.random() * 0.06,
    radius: 1.5 + Math.random() * 2.5,
    spiralSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4),
    phase: Math.random() * Math.PI * 2,
    wobbleSpeedX: 0.5 + Math.random() * 1.0,
    wobbleSpeedY: 0.5 + Math.random() * 1.0,
    wobbleAmp: 0.3 + Math.random() * 0.5,
  }));

export const generateStarfieldData = (numPoints) => {
  const arrPositions = new Float32Array(numPoints * 3);
  const arrColors = new Float32Array(numPoints * 3);
  const arrSpeeds = new Float32Array(numPoints);

  for (let i = 0; i < numPoints; i++) {
    const numIdx = i * 3;
    arrPositions[numIdx] = (Math.random() - 0.5) * 18;
    arrPositions[numIdx + 1] = (Math.random() - 0.5) * 18;
    arrPositions[numIdx + 2] = -35 + Math.random() * 40;
    arrSpeeds[i] = 0.05 + Math.random() * 0.15;
    const objColor = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    arrColors[numIdx] = objColor.r;
    arrColors[numIdx + 1] = objColor.g;
    arrColors[numIdx + 2] = objColor.b;
  }
  return { positions: arrPositions, colors: arrColors, speeds: arrSpeeds };
};

export const computeLightOpacity = (numZ) => {
  if (numZ < -25) return Math.max(0, Math.min(1, (numZ - -35) / 10));
  if (numZ > 0) return Math.max(0, Math.min(1, (5 - numZ) / 5));
  return 1;
};
