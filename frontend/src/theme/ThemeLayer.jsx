import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeContext } from '../hooks/useThemeContext';
import { ThemeEngine } from './ThemeEngine';
import {
  SnowfallParticles,
  BonfireEmbers,
  ConfettiParticles,
  HalloweenBats,
  DiwaliSparks,
} from './ThemeParticles';
import './ThemeLayer.css';

const THEME_META = {
  christmas: { label: 'Merry Christmas' },
  halloween: { label: 'Happy Halloween' },
  diwali:    { label: 'Happy Diwali' },
  new_year:  { label: 'Happy New Year' },
  winter:    { label: 'Stay Warm' },
  night:     { label: 'Good Night' },
  default:   { label: null },
};

function ThemeParticleLayer({ theme, intensity }) {
  if (intensity === 'none' || intensity === 'subtle') return null;

  switch (theme) {
    case 'christmas':
      return (
        <>
          <SnowfallParticles opacity={intensity === 'full' ? 0.85 : 0.5} />
          <BonfireEmbers opacity={intensity === 'full' ? 0.9 : 0.5} />
        </>
      );
    case 'halloween':
      return <HalloweenBats opacity={intensity === 'full' ? 0.9 : 0.6} />;
    case 'diwali':
      return <DiwaliSparks opacity={intensity === 'full' ? 0.9 : 0.6} />;
    case 'new_year':
      return <ConfettiParticles opacity={0.9} />;
    case 'winter':
      return <SnowfallParticles opacity={0.45} />;
    default:
      return null;
  }
}

export default function ThemeLayer() {
  const themeCtx = useThemeContext();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [badgeDismissed, setBadgeDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  
  const isVeriSphere = location.pathname.startsWith('/verisphere');

  
  useEffect(() => {
    ThemeEngine.apply(themeCtx.theme, themeCtx.intensity);
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, [themeCtx.theme, themeCtx.intensity]);

  
  useEffect(() => {
    if (themeCtx.theme === 'default' || isVeriSphere) return;
    setBadgeDismissed(false);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [themeCtx.theme, isVeriSphere]);

  const meta = THEME_META[themeCtx.theme] || THEME_META.default;

  return (
    <>
      {}
      {!isVeriSphere && (
        <div className="theme-ambient-overlay" aria-hidden="true" />
      )}

      {}
      {mounted && !isVeriSphere && (
        <ThemeParticleLayer theme={themeCtx.theme} intensity={themeCtx.intensity} />
      )}

      {}
      {}
    </>
  );
}

