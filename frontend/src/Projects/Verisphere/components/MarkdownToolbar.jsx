import React from 'react';
import PropTypes from 'prop-types';
import { applyMarkdown } from '../utils/markdownInsert';

const BUTTONS = [
  { action: 'bold', label: 'B', title: 'Bold', style: { fontWeight: 700 } },
  { action: 'italic', label: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
  { action: 'link', label: 'Link', title: 'Insert link' },
  { action: 'quote', label: 'Quote', title: 'Block quote' },
  { action: 'bullets', label: 'List', title: 'Bullet list' },
  { action: 'numbered', label: '1.', title: 'Numbered list' },
  { action: 'code', label: '</>', title: 'Code' },
];

const btnStyle = {
  background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '6px',
  color: 'var(--v2-text-muted)', cursor: 'pointer', padding: '3px 9px', fontSize: '0.75rem',
  fontFamily: "'JetBrains Mono', monospace",
};

// Reddit-style formatting toolbar: applies markdown to the textarea selection.
const MarkdownToolbar = ({ textareaRef, value, onChange, boolShowPreview, onTogglePreview }) => {
  const handleAction = (strAction) => {
    const elTextarea = textareaRef.current;
    if (!elTextarea) return;
    const objResult = applyMarkdown(value, elTextarea.selectionStart, elTextarea.selectionEnd, strAction);
    onChange(objResult.value);
    requestAnimationFrame(() => {
      elTextarea.focus();
      elTextarea.setSelectionRange(objResult.start, objResult.end);
    });
  };

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {BUTTONS.map((objBtn) => (
        <button key={objBtn.action} type="button" title={objBtn.title}
          onClick={() => handleAction(objBtn.action)} style={{ ...btnStyle, ...objBtn.style }}>
          {objBtn.label}
        </button>
      ))}
      <button type="button" onClick={onTogglePreview}
        style={{ ...btnStyle, marginLeft: 'auto', color: boolShowPreview ? 'var(--v2-accent-secondary)' : 'var(--v2-text-muted)' }}>
        {boolShowPreview ? 'Edit' : 'Preview'}
      </button>
    </div>
  );
};

MarkdownToolbar.propTypes = {
  textareaRef: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  boolShowPreview: PropTypes.bool,
  onTogglePreview: PropTypes.func.isRequired,
};

export default MarkdownToolbar;
