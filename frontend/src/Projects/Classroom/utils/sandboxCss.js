import { parseToHex } from './colorUtils';

export const CSS_KEY_MAP = {
  strDisplay: 'display',
  strFlexDirection: 'flex-direction',
  strJustifyContent: 'justify-content',
  strAlignItems: 'align-items',
  numGap: 'gap',
  strBackground: 'background-color',
  numPadding: 'padding',
  numBorderRadius: 'border-radius',
  numBorderWidth: 'border-width',
  strBorderStyle: 'border-style',
  strBorderColor: 'border-color',
  strColor: 'color',
  strFontSize: 'font-size',
  strFontWeight: 'font-weight',
  strTextAlign: 'text-align',
  strGridTemplateColumns: 'grid-template-columns',
};

export const EMPTY_GUI_STATE = {
  strDisplay: 'block', strFlexDirection: 'row',
  strJustifyContent: 'flex-start', strAlignItems: 'stretch',
  numGap: 0, strBackground: '#ffffff', numPadding: 0,
  numBorderRadius: 0, numBorderWidth: 0, strBorderStyle: 'none',
  strBorderColor: '#334155', strColor: '#ffffff',
  strFontSize: '1rem', strFontWeight: '400', strTextAlign: 'left',
  strGridTemplateColumns: 'none',
};

const escapeSelector = (strSel) => strSel.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

export const parseSelectorBlock = (strCss, strTargetSelector) => {
  const blockRegex = new RegExp(`${escapeSelector(strTargetSelector)}\\s*\\{([^}]+)\\}`, 'i');
  const objMatch = strCss.match(blockRegex);
  if (!objMatch) return null;

  const objPropsMap = {};
  objMatch[1].split(';').forEach((strRule) => {
    const arrParts = strRule.split(':');
    if (arrParts.length >= 2) {
      const strKey = arrParts[0].trim().toLowerCase();
      const strVal = arrParts.slice(1).join(':').trim();
      if (strKey) objPropsMap[strKey] = strVal;
    }
  });
  return objPropsMap;
};

export const guiStateFromProps = (objPropsMap) => ({
  strDisplay: objPropsMap['display'] || 'block',
  strFlexDirection: objPropsMap['flex-direction'] || 'row',
  strJustifyContent: objPropsMap['justify-content'] || 'flex-start',
  strAlignItems: objPropsMap['align-items'] || 'stretch',
  numGap: parseInt(objPropsMap['gap'], 10) || 0,
  strBackground: parseToHex(objPropsMap['background-color'] || objPropsMap['background'] || '#ffffff'),
  numPadding: parseInt(objPropsMap['padding'], 10) || 0,
  numBorderRadius: parseInt(objPropsMap['border-radius'], 10) || 0,
  numBorderWidth: parseInt(objPropsMap['border-width'], 10) || 0,
  strBorderStyle: objPropsMap['border-style'] || 'none',
  strBorderColor: parseToHex(objPropsMap['border-color'] || '#334155'),
  strColor: parseToHex(objPropsMap['color'] || '#ffffff'),
  strFontSize: objPropsMap['font-size'] || '1rem',
  strFontWeight: objPropsMap['font-weight'] || '400',
  strTextAlign: objPropsMap['text-align'] || 'left',
  strGridTemplateColumns: objPropsMap['grid-template-columns'] || 'none',
});

export const writeRuleToCss = (strCss, strTarget, strCssKey, strCssValue) => {
  const strEscaped = escapeSelector(strTarget);
  const blockRegex = new RegExp(`(${strEscaped}\\s*\\{)([^}]+)(\\})`, 'i');
  const strDeclaration = `  ${strCssKey}: ${strCssValue};`;
  const objMatch = strCss.match(blockRegex);
  if (!objMatch) return strCss.trim() + `\n\n${strTarget} {\n${strDeclaration}\n}`;

  const strInner = objMatch[2];
  const propRegex = new RegExp(`(${strCssKey}\\s*:\\s*)([^;]+)(;?)`, 'i');
  const strUpdated = propRegex.test(strInner)
    ? strInner.replace(propRegex, `$1${strCssValue}$3`)
    : strInner.trimEnd() + `\n${strDeclaration}\n`;
  return strCss.replace(blockRegex, `$1${strUpdated}$3`);
};

export const cssValueFromGui = (strKey, val) => {
  const arrPxKeys = ['numGap', 'numPadding', 'numBorderRadius', 'numBorderWidth'];
  return arrPxKeys.includes(strKey) ? `${val}px` : val;
};

export const buildIframeSrcDoc = (strHtml, strCss) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 2rem; font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; overflow-x: hidden; display: flex; align-items: center; justify-content: center; }
    * { box-sizing: border-box; transition: all 0.3s ease; }
    ${strCss}
  </style>
</head>
<body>
  ${strHtml}
</body>
</html>`;
