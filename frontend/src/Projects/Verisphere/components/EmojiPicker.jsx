import React from 'react';
import PropTypes from 'prop-types';
import { EXTENDED_EMOJIS } from '../utils/embedUtils';

const styleButton = (boolReacted) => ({
  background: boolReacted ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
  border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '4px', borderRadius: '6px',
});

const EmojiPicker = ({ arrTopReactions, objUserReacted, onReact }) => (
  <div
    onClick={(e) => e.stopPropagation()}
    className="verisphere-emoji-picker-grid"
    style={{
      position: 'absolute', bottom: '100%', left: 0, marginBottom: '0px',
      background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)', borderRadius: '12px',
      zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: '170px',
    }}
  >
    {arrTopReactions.length > 0 && (
      <>
        <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: 'var(--v2-text-muted)', marginBottom: '2px', textAlign: 'left', paddingLeft: '4px' }}>
          Top in post
        </div>
        {arrTopReactions.slice(0, 4).map(([strEmoji]) => (
          <button
            key={`top-${strEmoji}`}
            onClick={(e) => { e.stopPropagation(); onReact(strEmoji); }}
            style={styleButton(objUserReacted[strEmoji])}
          >
            {strEmoji}
          </button>
        ))}
        <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
      </>
    )}
    {EXTENDED_EMOJIS.map((strEmoji) => (
      <button
        key={strEmoji}
        onClick={(e) => { e.stopPropagation(); onReact(strEmoji); }}
        style={styleButton(objUserReacted[strEmoji])}
      >
        {strEmoji}
      </button>
    ))}
  </div>
);

EmojiPicker.propTypes = {
  arrTopReactions: PropTypes.array.isRequired,
  objUserReacted: PropTypes.object.isRequired,
  onReact: PropTypes.func.isRequired,
};

export default EmojiPicker;
