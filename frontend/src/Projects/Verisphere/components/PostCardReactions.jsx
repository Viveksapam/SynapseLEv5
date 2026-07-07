import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import EmojiPicker from './EmojiPicker';

const reactionButtonStyle = (boolActive) => ({
  background: boolActive ? 'var(--cr-surface-raised)' : 'transparent',
  border: boolActive ? '1px solid var(--cr-text-main)' : '1px solid var(--cr-border)',
  borderRadius: 'var(--cr-radius-chip)', cursor: 'pointer', fontSize: '13px', padding: '3px 10px',
  display: 'flex', alignItems: 'center', gap: '5px',
  color: boolActive ? 'var(--cr-text-main)' : 'var(--cr-text-muted)',
  transition: 'all 0.2s', fontFamily: 'var(--cr-font-mono)',
});

const PostCardReactions = ({ reactions, commentsCount, postId }) => {
  const { arrTopReactions, objUserReactedState, boolShowPickerState, setShowPicker, handleReact } = reactions;

  return (
    <div className="vs-post-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'nowrap', position: 'relative' }}>
      <div className="verisphere-reacts" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', position: 'relative' }}>
        {arrTopReactions.slice(0, window.innerWidth < 768 ? 2 : 5).map(([strEmoji, numCount]) => (
          <button
            key={strEmoji}
            className="vs-react-btn"
            onClick={(e) => { e.stopPropagation(); handleReact(strEmoji); }}
            style={reactionButtonStyle(objUserReactedState[strEmoji])}
          >
            <span>{strEmoji}</span> <span>{numCount}</span>
          </button>
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); setShowPicker(!boolShowPickerState); }}
          style={{
            background: 'transparent', border: '1px dashed var(--cr-border)', borderRadius: 'var(--cr-radius-chip)',
            cursor: 'pointer', fontSize: '13px', padding: '3px 10px',
            color: 'var(--cr-text-muted)', display: 'flex', alignItems: 'center', transition: 'all 0.2s', position: 'relative',
          }}
        >
          {boolShowPickerState ? '-' : '+'}
          {boolShowPickerState && (
            <EmojiPicker
              arrTopReactions={arrTopReactions}
              objUserReacted={objUserReactedState}
              onReact={handleReact}
            />
          )}
        </button>
      </div>

      <Link
        to={`/verisphere/post/${postId}`}
        className="verisphere-action-link"
        style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
      >
        {commentsCount} comments
      </Link>
    </div>
  );
};

PostCardReactions.propTypes = {
  reactions: PropTypes.object.isRequired,
  commentsCount: PropTypes.number.isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default PostCardReactions;
