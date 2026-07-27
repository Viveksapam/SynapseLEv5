import { describe, it, expect } from 'vitest';
import { detectTheme } from '../../hooks/useThemeContext';

describe('detectTheme', () => {
  it('returns christmas theme on Dec 25 at night', () => {
    const result = detectTheme(new Date(2025, 11, 25, 22, 0));
    expect(result.theme).toBe('christmas');
    expect(result.intensity).toBe('full');
  });

  it('returns christmas theme on Dec 25 during day', () => {
    const result = detectTheme(new Date(2025, 11, 25, 14, 0));
    expect(result.theme).toBe('christmas');
    expect(result.intensity).toBe('moderate');
  });

  it('returns new_year theme on Jan 1 at 2am', () => {
    const result = detectTheme(new Date(2026, 0, 1, 2, 0));
    expect(result.theme).toBe('new_year');
    expect(result.mood).toBe('festive');
  });

  it('returns halloween theme on Oct 31 evening', () => {
    const result = detectTheme(new Date(2025, 9, 31, 20, 0));
    expect(result.theme).toBe('halloween');
    expect(result.intensity).toBe('full');
  });

  it('returns halloween theme on Oct 27 daytime', () => {
    const result = detectTheme(new Date(2025, 9, 27, 12, 0));
    expect(result.theme).toBe('halloween');
    expect(result.intensity).toBe('moderate');
  });

  it('returns diwali theme on Nov 3 night', () => {
    const result = detectTheme(new Date(2025, 10, 3, 22, 0));
    expect(result.theme).toBe('diwali');
    expect(result.intensity).toBe('full');
  });

  it('returns winter theme on Jan 15 daytime', () => {
    const result = detectTheme(new Date(2026, 0, 15, 14, 0));
    expect(result.theme).toBe('winter');
    expect(result.mood).toBe('calm');
  });

  it('returns night theme at 11pm on a regular day', () => {
    const result = detectTheme(new Date(2025, 5, 15, 23, 0));
    expect(result.theme).toBe('night');
  });

  it('returns default theme on a summer afternoon', () => {
    const result = detectTheme(new Date(2025, 6, 15, 14, 0));
    expect(result.theme).toBe('default');
    expect(result.mood).toBe('professional');
  });

  it('returns night theme at 3am in summer', () => {
    const result = detectTheme(new Date(2025, 6, 15, 3, 0));
    expect(result.theme).toBe('night');
  });
});
