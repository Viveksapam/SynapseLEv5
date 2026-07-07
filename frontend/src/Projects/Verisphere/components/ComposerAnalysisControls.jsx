import React from 'react';
import PropTypes from 'prop-types';

export const FOCUS_LENSES = [
  { value: 'fact_check', label: 'Fact-check' },
  { value: 'sources', label: 'Sources' },
  { value: 'logic', label: 'Logic and reasoning' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'react_in_kind', label: 'React in kind' },
];

const radioRow = { display: 'flex', gap: '8px', alignItems: 'baseline', cursor: 'pointer', fontSize: '13px', color: 'var(--cr-text-main)' };
const helpStyle = { fontSize: '11px', color: 'var(--cr-text-muted)', margin: '8px 0 0 22px', lineHeight: '1.5' };

// The author's analysis consent. compact=true renders the light-surface version
// (a single "Not for analysis" toggle); the full version offers open/limited/off.
const ComposerAnalysisControls = ({ mode, onModeChange, allowedLenses, onLensesChange, compact }) => {
  if (compact) {
    return (
      <label style={{ ...radioRow, fontSize: '12.5px', color: 'var(--cr-text-muted)' }}>
        <input type="checkbox" checked={mode === 'off'} onChange={(e) => onModeChange(e.target.checked ? 'off' : 'open')} />
        Not for analysis - readers will not see an analyze option on this post
      </label>
    );
  }

  const toggleLens = (strLens) => {
    onLensesChange(allowedLenses.includes(strLens)
      ? allowedLenses.filter((l) => l !== strLens)
      : [...allowedLenses, strLens]);
  };

  return (
    <div style={{ display: 'grid', gap: '8px', padding: '12px 14px', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-input)' }}>
      <p style={{ margin: 0, fontSize: '10.5px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--cr-font-mono)', color: 'var(--cr-text-muted)' }}>
        Reader analysis
      </p>
      <label style={radioRow}>
        <input type="radio" name="analysisMode" checked={mode === 'open'} onChange={() => onModeChange('open')} />
        Open to analysis
      </label>
      <label style={radioRow}>
        <input type="radio" name="analysisMode" checked={mode === 'limited'} onChange={() => onModeChange('limited')} />
        Limited - only the lenses I choose
      </label>
      {mode === 'limited' && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '0 0 0 22px' }}>
          {FOCUS_LENSES.map((objLens) => (
            <label key={objLens.value} style={{ ...radioRow, fontSize: '0.8rem' }}>
              <input type="checkbox" checked={allowedLenses.includes(objLens.value)} onChange={() => toggleLens(objLens.value)} />
              {objLens.label}
            </label>
          ))}
        </div>
      )}
      <label style={radioRow}>
        <input type="radio" name="analysisMode" checked={mode === 'off'} onChange={() => onModeChange('off')} />
        Not for analysis
      </label>
      <p style={helpStyle}>
        Your choice, changeable later. Analyses are opt-in reader requests and are never a verdict on you.
      </p>
    </div>
  );
};

ComposerAnalysisControls.propTypes = {
  mode: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired,
  allowedLenses: PropTypes.array.isRequired,
  onLensesChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

export default ComposerAnalysisControls;
