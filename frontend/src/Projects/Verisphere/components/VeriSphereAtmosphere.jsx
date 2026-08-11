import React, { useEffect, useRef } from 'react';
import { useThemeContext } from '../../../hooks/useThemeContext';
import { initParticlesForTheme } from '../utils/particleFactories';
import { updateAndDrawParticles } from '../utils/particleRenderer';
import './VeriSphereAtmosphere.css';

const THEME_LAYERS = ['night', 'winter', 'halloween', 'christmas', 'diwali', 'default'];

const VeriSphereAtmosphere = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ particles: [], initialized: false });
  const { theme, intensity } = useThemeContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    stateRef.current.initialized = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.initialized = false;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      animRef.current = requestAnimationFrame(tick);
      const numW = canvas.width;
      const numH = canvas.height;

      if (!stateRef.current.initialized) {
        stateRef.current.particles = initParticlesForTheme(theme, numW, numH);
        stateRef.current.initialized = true;
      }

      ctx.clearRect(0, 0, numW, numH);
      updateAndDrawParticles(ctx, stateRef.current.particles, numW, numH);
    };
    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme, intensity]);

  return (
    <div className="vs-atmosphere-container" aria-hidden="true">
      {THEME_LAYERS.map((strTheme) => {
        const boolActive = theme === strTheme || (theme === 'default' && strTheme === 'night');
        return (
          <div
            key={strTheme}
            className={`vs-bg-layer vs-bg-${strTheme} ${boolActive ? 'active' : ''}`}
          />
        );
      })}
      <canvas ref={canvasRef} className="vs-atmosphere-canvas" />
    </div>
  );
};

export default VeriSphereAtmosphere;
