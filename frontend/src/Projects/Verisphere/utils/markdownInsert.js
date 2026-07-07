// Wraps or inserts markdown syntax at the current selection of a textarea and
// returns the new value plus the cursor range to restore.
export const applyMarkdown = (strValue, numStart, numEnd, strAction) => {
  const strSelected = strValue.slice(numStart, numEnd) || 'text';
  const strBefore = strValue.slice(0, numStart);
  const strAfter = strValue.slice(numEnd);

  const wrap = (strOpen, strClose = strOpen) => ({
    value: strBefore + strOpen + strSelected + strClose + strAfter,
    start: numStart + strOpen.length,
    end: numStart + strOpen.length + strSelected.length,
  });

  const linePrefix = (strPrefix) => {
    const arrLines = strSelected.split('\n').map((l, i) =>
      strAction === 'numbered' ? `${i + 1}. ${l}` : `${strPrefix}${l}`);
    const strBlock = arrLines.join('\n');
    return {
      value: `${strBefore}${strBlock}${strAfter}`,
      start: numStart,
      end: numStart + strBlock.length,
    };
  };

  switch (strAction) {
    case 'bold': return wrap('**');
    case 'italic': return wrap('*');
    case 'code': return strSelected.includes('\n') ? wrap('```\n', '\n```') : wrap('`');
    case 'link': {
      const strInsert = `[${strSelected}](url)`;
      return {
        value: strBefore + strInsert + strAfter,
        start: numStart + strSelected.length + 3,
        end: numStart + strSelected.length + 6,
      };
    }
    case 'quote': return linePrefix('> ');
    case 'bullets': return linePrefix('- ');
    case 'numbered': return linePrefix('');
    default: return { value: strValue, start: numStart, end: numEnd };
  }
};
