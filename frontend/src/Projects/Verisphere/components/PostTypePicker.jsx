import React from 'react';
import PropTypes from 'prop-types';

// The composer's opening interaction: choosing a format, not filling metadata.
// The chosen type drives which composer surface unfolds (progressive disclosure).
export const POST_TYPES = [
  { value: 'musing', label: 'Musing', hint: 'A thought, a vibe - no claims attached' },
  { value: 'question', label: 'Question', hint: 'You want answers, not audits' },
  { value: 'satire', label: 'Satire', hint: 'Humor - never fact-checked as literal' },
  { value: 'opinion', label: 'Opinion', hint: 'Your take, text-forward' },
  { value: 'claim', label: 'Claim', hint: 'Checkable statement - full toolkit' },
  { value: 'mixed', label: 'Mixed', hint: 'A bit of everything' },
];

// Surface tiers for progressive disclosure.
export const surfaceFor = (strType) => {
  if (['musing', 'question', 'satire'].includes(strType)) return 'light';
  if (strType === 'opinion') return 'text';
  return 'full';
};

const PostTypePicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {POST_TYPES.map((objType) => {
      const boolActive = value === objType.value;
      return (
        <button
          key={objType.value}
          type="button"
          title={objType.hint}
          onClick={() => onChange(objType.value)}
          style={{
            background: boolActive ? 'var(--cr-surface-raised)' : 'transparent',
            border: `1px solid ${boolActive ? 'var(--cr-text-main)' : 'var(--cr-border)'}`,
            color: boolActive ? 'var(--cr-text-main)' : 'var(--cr-text-muted)',
            fontWeight: boolActive ? 600 : 400,
            borderRadius: 'var(--cr-radius-chip)', padding: '5px 14px', cursor: 'pointer', fontSize: '12.5px',
            fontFamily: 'var(--cr-font-heading)',
          }}
        >
          {objType.label}
        </button>
      );
    })}
  </div>
);

PostTypePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PostTypePicker;
