import React from 'react';
import PropTypes from 'prop-types';



export const POST_TYPES = [
  { value: 'thought', label: 'Thought', hint: 'A passing thought - not a claim' },
  { value: 'question', label: 'Question', hint: 'Asking for answers, not analysis' },
  { value: 'opinion', label: 'Opinion', hint: 'Your personal take' },
  { value: 'claim', label: 'Claim', hint: 'A statement that can be checked' },
  { value: 'mixed', label: 'Mixed', hint: 'Combines several of the above' },
];


export const surfaceFor = (strType) => {
  if (['thought', 'question'].includes(strType)) return 'light';
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
