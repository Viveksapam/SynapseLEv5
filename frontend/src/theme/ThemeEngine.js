

const THEME_VARS = {
  default: {
    '--theme-bg-primary': '#1c1a1a',
    '--theme-bg-secondary': '#272425',
    '--theme-accent-1': '#9f1239',
    '--theme-accent-2': '#7f1d1d',
    '--theme-accent-glow': 'rgba(159, 18, 57, 0.3)',
    '--theme-particle-color-1': '#ffffff',
    '--theme-particle-color-2': '#fbbf24',
    '--theme-particle-color-3': '#fca5a5',
    '--theme-ambient-overlay': 'transparent',
    '--theme-text-primary': '#f8fafc',
    '--theme-text-muted': '#a1a1aa',
    '--theme-nav-bg': 'rgba(28, 26, 26, 0.85)',
    '--theme-shadow-glow': 'none',
  },
  christmas: {
    '--theme-bg-primary': '#050f05',
    '--theme-bg-secondary': '#0a1a0a',
    '--theme-accent-1': '#c41e3a',       
    '--theme-accent-2': '#165b33',       
    '--theme-accent-glow': 'rgba(196, 30, 58, 0.4)',
    '--theme-particle-color-1': '#ffffff',   
    '--theme-particle-color-2': '#ff6b6b',   
    '--theme-particle-color-3': '#ffd700',   
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% 120%, rgba(255, 100, 30, 0.15) 0%, transparent 60%)',
    '--theme-text-primary': '#fff5f5',
    '--theme-text-muted': '#a3b89a',
    '--theme-nav-bg': 'rgba(5, 15, 5, 0.9)',
    '--theme-shadow-glow': '0 0 40px rgba(196, 30, 58, 0.3)',
  },
  halloween: {
    '--theme-bg-primary': '#0d0608',
    '--theme-bg-secondary': '#180d10',
    '--theme-accent-1': '#f97316',       
    '--theme-accent-2': '#ef4444',       
    '--theme-accent-glow': 'rgba(249, 115, 22, 0.35)',
    '--theme-particle-color-1': '#f97316',
    '--theme-particle-color-2': '#ef4444',
    '--theme-particle-color-3': '#fbbf24',
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
    '--theme-text-primary': '#fff7ed',
    '--theme-text-muted': '#9ca3af',
    '--theme-nav-bg': 'rgba(13, 6, 8, 0.92)',
    '--theme-shadow-glow': '0 0 40px rgba(249, 115, 22, 0.25)',
  },
  diwali: {
    '--theme-bg-primary': '#0c0802',
    '--theme-bg-secondary': '#1a1005',
    '--theme-accent-1': '#f59e0b',       
    '--theme-accent-2': '#dc2626',       
    '--theme-accent-glow': 'rgba(245, 158, 11, 0.4)',
    '--theme-particle-color-1': '#ffd700',
    '--theme-particle-color-2': '#ff6b35',
    '--theme-particle-color-3': '#ff3cac',
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
    '--theme-text-primary': '#fffbeb',
    '--theme-text-muted': '#92400e',
    '--theme-nav-bg': 'rgba(12, 8, 2, 0.9)',
    '--theme-shadow-glow': '0 0 60px rgba(245, 158, 11, 0.3)',
  },
  new_year: {
    '--theme-bg-primary': '#020409',
    '--theme-bg-secondary': '#050d1a',
    '--theme-accent-1': '#ffd700',       
    '--theme-accent-2': '#c0c0c0',       
    '--theme-accent-glow': 'rgba(255, 215, 0, 0.45)',
    '--theme-particle-color-1': '#ffd700',
    '--theme-particle-color-2': '#ff3cac',
    '--theme-particle-color-3': '#00f0ff',
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.12) 0%, transparent 60%)',
    '--theme-text-primary': '#fefce8',
    '--theme-text-muted': '#a8a29e',
    '--theme-nav-bg': 'rgba(2, 4, 9, 0.92)',
    '--theme-shadow-glow': '0 0 80px rgba(255, 215, 0, 0.35)',
  },
  winter: {
    '--theme-bg-primary': '#080c12',
    '--theme-bg-secondary': '#0e1520',
    '--theme-accent-1': '#2dd4bf',
    '--theme-accent-2': '#5eead4',
    '--theme-accent-glow': 'rgba(45, 212, 191, 0.3)',
    '--theme-particle-color-1': '#f0fdfa',
    '--theme-particle-color-2': '#a7f3d0',
    '--theme-particle-color-3': '#99f6e4',
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% -20%, rgba(45, 212, 191, 0.1) 0%, transparent 60%)',
    '--theme-text-primary': '#ecfeff',
    '--theme-text-muted': '#5eead4',
    '--theme-nav-bg': 'rgba(8, 12, 18, 0.9)',
    '--theme-shadow-glow': '0 0 40px rgba(45, 212, 191, 0.2)',
  },
  night: {
    '--theme-bg-primary': '#020308',
    '--theme-bg-secondary': '#060a14',
    '--theme-accent-1': '#f43f5e',
    '--theme-accent-2': '#f43f5e',
    '--theme-accent-glow': 'rgba(244, 63, 94, 0.3)',
    '--theme-particle-color-1': '#fecaca',
    '--theme-particle-color-2': '#fca5a5',
    '--theme-particle-color-3': '#f43f5e',
    '--theme-ambient-overlay': 'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.08) 0%, transparent 60%)',
    '--theme-text-primary': '#fef2f2',
    '--theme-text-muted': '#f43f5e',
    '--theme-nav-bg': 'rgba(2, 3, 8, 0.95)',
    '--theme-shadow-glow': '0 0 40px rgba(244, 63, 94, 0.2)',
  },
};

class ThemeEngineClass {
  currentTheme = 'default';
  transitionMs = 1200;

  apply(themeName, intensity = 'moderate') {
    const vars = THEME_VARS[themeName] || THEME_VARS.default;
    const root = document.documentElement;

    
    root.style.setProperty('transition', `background-color ${this.transitionMs}ms ease, color ${this.transitionMs}ms ease`);

    
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    
    if (themeName !== 'default') {
      root.style.setProperty('--bg-main', vars['--theme-bg-primary']);
      root.style.setProperty('--bg-card', vars['--theme-bg-secondary']);
      root.style.setProperty('--accent-primary', vars['--theme-accent-1']);
      root.style.setProperty('--accent-secondary', vars['--theme-accent-2']);
      root.style.setProperty('--accent-primary-light', vars['--theme-accent-glow']);
      root.style.setProperty('--bg-nav', vars['--theme-nav-bg']);
    }

    
    document.body.classList.forEach(cls => {
      if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${themeName}`);
    document.body.dataset.themeIntensity = intensity;

    this.currentTheme = themeName;
  }

  reset() {
    this.apply('default', 'none');
  }
}

export const ThemeEngine = new ThemeEngineClass();
export { THEME_VARS };

