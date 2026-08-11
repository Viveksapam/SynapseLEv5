import React from 'react';
import PropTypes from 'prop-types';

const radioRow = { display: 'flex', gap: '8px', alignItems: 'baseline', cursor: 'pointer', fontSize: '13px', color: 'var(--cr-text-main)' };
const helpStyle = { fontSize: '11px', color: 'var(--cr-text-muted)', margin: '8px 0 0 22px', lineHeight: '1.5' };



const ComposerAnalysisControls = ({ mode, onModeChange, compact }) => {
  if (compact) {
    return (
      <label style={{ ...radioRow, fontSize: '12.5px', color: 'var(--cr-text-muted)' }}>
        <input type="checkbox" checked={mode === 'off'} onChange={(e) => onModeChange(e.target.checked ? 'off' : 'open')} />
        Not for analysis - readers will not see an analyze option on this post
      </label>
    );
  }

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
  compact: PropTypes.bool,
};

export default ComposerAnalysisControls;
