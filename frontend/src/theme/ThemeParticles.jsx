import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { snowInit, emberInit, confettiInit, batInit, diwaliInit } from './particleFactories';
import { snowDraw, emberDraw, confettiDraw, batDraw, diwaliDraw } from './particleDraws';

const ParticleCanvas = ({ draw, init, style = {} }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], animId: null });

  useEffect(() => {
    const objCanvas = canvasRef.current;
    if (!objCanvas) return;
    const ctx = objCanvas.getContext('2d');

    const resize = () => {
      objCanvas.width = window.innerWidth;
      objCanvas.height = window.innerHeight;
      stateRef.current.particles = init(objCanvas.width, objCanvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      draw(ctx, objCanvas.width, objCanvas.height, stateRef.current.particles);
      stateRef.current.animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(stateRef.current.animId);
    };
  }, [draw, init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 9998, ...style,
      }}
    />
  );
};

ParticleCanvas.propTypes = {
  draw: PropTypes.func.isRequired,
  init: PropTypes.func.isRequired,
  style: PropTypes.object,
};

export const SnowfallParticles = ({ opacity = 1 }) => (
  <ParticleCanvas init={snowInit} draw={snowDraw} style={{ opacity }} />
);
SnowfallParticles.propTypes = { opacity: PropTypes.number };

export const BonfireEmbers = ({ opacity = 1 }) => (
  <ParticleCanvas init={emberInit} draw={emberDraw} style={{ opacity }} />
);
BonfireEmbers.propTypes = { opacity: PropTypes.number };

export const ConfettiParticles = ({ opacity = 1 }) => (
  <ParticleCanvas init={confettiInit} draw={confettiDraw} style={{ opacity }} />
);
ConfettiParticles.propTypes = { opacity: PropTypes.number };

export const HalloweenBats = ({ opacity = 1 }) => (
  <ParticleCanvas init={batInit} draw={batDraw} style={{ opacity }} />
);
HalloweenBats.propTypes = { opacity: PropTypes.number };

export const DiwaliSparks = ({ opacity = 1 }) => (
  <ParticleCanvas init={diwaliInit} draw={diwaliDraw} style={{ opacity }} />
);
DiwaliSparks.propTypes = { opacity: PropTypes.number };
