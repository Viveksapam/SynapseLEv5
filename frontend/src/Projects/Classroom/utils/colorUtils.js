const NAMED_COLORS = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', purple: '#800080', orange: '#ffa500',
  pink: '#ffc0cb', gray: '#808080', grey: '#808080', indigo: '#4b0082',
  violet: '#ee82ee', cyan: '#00ffff', magenta: '#ff00ff', crimson: '#dc143c',
  navy: '#000080', teal: '#008080', transparent: '#ffffff',
};

export const parseToHex = (strColor) => {
  if (!strColor) return '#ffffff';
  const strNormalized = strColor.trim().toLowerCase();

  if (strNormalized.startsWith('#')) {
    if (strNormalized.length === 4) {
      return '#' + strNormalized[1] + strNormalized[1] + strNormalized[2] + strNormalized[2] + strNormalized[3] + strNormalized[3];
    }
    return strNormalized.substring(0, 7);
  }

  const arrRgbMatch = strNormalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (arrRgbMatch) {
    const strR = parseInt(arrRgbMatch[1], 10).toString(16).padStart(2, '0');
    const strG = parseInt(arrRgbMatch[2], 10).toString(16).padStart(2, '0');
    const strB = parseInt(arrRgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${strR}${strG}${strB}`;
  }

  return NAMED_COLORS[strNormalized] || '#ffffff';
};
