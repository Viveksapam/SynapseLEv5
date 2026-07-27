

import { useState, useEffect } from 'react';


export function detectTheme(now = new Date()) {
  const month = now.getMonth() + 1; 
  const day = now.getDate();
  const hour = now.getHours();
  const isNight = hour >= 21 || hour < 5;
  const isEvening = hour >= 18 || hour < 5;

  
  if ((month === 12 && day >= 20) || (month === 1 && day === 1)) {
    if (month === 1 && day === 1 && hour >= 0 && hour < 4) {
      return { theme: 'new_year', intensity: 'full', mood: 'festive' };
    }
    return {
      theme: 'christmas',
      intensity: isNight ? 'full' : 'moderate',
      mood: isNight ? 'cozy' : 'festive',
    };
  }

  
  if (month === 10 && day >= 25 && day <= 31) {
    return {
      theme: 'halloween',
      intensity: isEvening ? 'full' : 'moderate',
      mood: 'mysterious',
    };
  }

  
  if (month === 11 && day >= 1 && day <= 5) {
    return { theme: 'diwali', intensity: isNight ? 'full' : 'moderate', mood: 'festive' };
  }

  
  if (((month === 12 && day < 20) || month === 1 || month === 2) && !isNight) {
    return { theme: 'winter', intensity: 'subtle', mood: 'calm' };
  }



  
  if (isNight) {
    return { theme: 'night', intensity: 'moderate', mood: 'calm' };
  }

  
  return { theme: 'default', intensity: 'none', mood: 'professional' };
}

export function useThemeContext() {
  const [themeCtx, setThemeCtx] = useState(() => detectTheme());

  useEffect(() => {
    
    const interval = setInterval(() => {
      setThemeCtx(detectTheme());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return themeCtx;
}

