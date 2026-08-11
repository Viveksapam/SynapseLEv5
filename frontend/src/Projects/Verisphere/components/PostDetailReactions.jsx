import React from 'react';
import PropTypes from 'prop-types';
import EmojiPicker from './EmojiPicker';

const pillStyle = (boolActive) => ({
  background: boolActive ? 'var(--cr-surface-raised)' : 'transparent',
  border: boolActive ? '1px solid var(--cr-text-main)' : '1px solid var(--cr-border)',
  borderRadius: 'var(--cr-radius-chip)', cursor: 'pointer', fontSize: '1rem', padding: '4px 12px',
  display: 'flex', alignItems: 'center', gap: '6px',
  color: boolActive ? 'var(--cr-text-main)' : 'var(--cr-text-muted)',
  transition: 'all 0.2s', fontWeight: 'bold',
});

const PostDetailReactions = ({ reactions }) => {
  const { arrTopReactions, objUserReactedState, boolShowPickerState, setShowPicker, handleReact } = reactions;

  return (
    <div className="verisphere-post-reacts-detail" style={{
      display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem', marginBottom: '1rem', position: 'relative',
    }}>
      {arrTopReactions.map(([strEmoji, numCount]) => (
        <button key={strEmoji} onClick={() => handleReact(strEmoji)} style={pillStyle(objUserReactedState[strEmoji])}>
          <span style={{ fontSize: '1.2rem' }}>{strEmoji}</span> <span>{numCount}</span>
        </button>
      ))}
      <button
        onClick={(e) => { e.stopPropagation(); setShowPicker(!boolShowPickerState); }}
        style={{
          background: 'transparent', border: '1px dashed var(--cr-border)', borderRadius: 'var(--cr-radius-chip)',
          cursor: 'pointer', fontSize: '1rem', padding: '4px 12px',
          color: 'var(--cr-text-muted)', display: 'flex', alignItems: 'center', transition: 'all 0.2s',
        }}
      >
        {boolShowPickerState ? '- React' : '+ React'}
      </button>
      {boolShowPickerState && (
        <EmojiPicker
          arrTopReactions={arrTopReactions}
          objUserReacted={objUserReactedState}
          onReact={handleReact}
        />
      )}
    </div>
  );
};

PostDetailReactions.propTypes = { reactions: PropTypes.object.isRequired };

export default PostDetailReactions;
