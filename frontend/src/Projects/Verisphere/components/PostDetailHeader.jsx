import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MediaEmbed from './MediaEmbed';
import PostDetailReactions from './PostDetailReactions';
import MarkdownContent from './MarkdownContent';
import ReportButton from './ReportButton';

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--cr-radius-input)', border: '1px solid var(--cr-border)',
  background: 'var(--cr-surface-raised)', color: 'var(--cr-text-main)', fontFamily: 'var(--cr-font-body)', fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const PostDetailHeader = ({ post, reactions, boolCanEdit, onSave, boolIsLoggedIn }) => {
  const [boolIsExpandedState, setBoolIsExpandedState] = useState(false);
  const [numWindowWidth, setNumWindowWidth] = useState(window.innerWidth);
  const [boolIsEditingState, setBoolIsEditingState] = useState(false);
  const [boolIsSavingState, setBoolIsSavingState] = useState(false);
  const [strEditTitleState, setStrEditTitleState] = useState(post.strTitle || '');
  const [strEditContentState, setStrEditContentState] = useState(post.strContent || '');
  const [strEditMediaUrlState, setStrEditMediaUrlState] = useState(post.strMediaUrl || '');

  React.useEffect(() => {
    const handleResize = () => setNumWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openEdit = () => {
    setStrEditTitleState(post.strTitle || '');
    setStrEditContentState(post.strContent || '');
    setStrEditMediaUrlState(post.strMediaUrl || '');
    setBoolIsEditingState(true);
  };

  const handleSave = async () => {
    if (!strEditTitleState.trim() || !strEditContentState.trim()) return;
    setBoolIsSavingState(true);
    try {
      await onSave({
        strTitle: strEditTitleState,
        strContent: strEditContentState,
        strMediaUrl: strEditMediaUrlState,
      });
      setBoolIsEditingState(false);
    } catch (objErr) {
      alert(objErr.message || 'Failed to save changes.');
    } finally {
      setBoolIsSavingState(false);
    }
  };

  const MAX_CHARS = numWindowWidth >= 768 ? 280 : 160;
  const boolNeedsCollapse = post.strContent && post.strContent.length > MAX_CHARS;
  const strDisplayContent = boolIsExpandedState ? post.strContent : post.strContent?.substring(0, MAX_CHARS);

  if (boolIsEditingState) {
    return (
      <div className="verisphere-detail-header" style={{ position: 'relative' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cr-text-muted)', marginBottom: '0.3rem' }}>Title</label>
        <input
          style={{ ...inputStyle, marginBottom: '0.8rem', fontSize: '1.1rem' }}
          value={strEditTitleState}
          onChange={(e) => setStrEditTitleState(e.target.value)}
          maxLength={255}
        />
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cr-text-muted)', marginBottom: '0.3rem' }}>Content</label>
        <textarea
          style={{ ...inputStyle, marginBottom: '0.8rem', minHeight: '180px', resize: 'vertical', lineHeight: '1.5' }}
          value={strEditContentState}
          onChange={(e) => setStrEditContentState(e.target.value)}
        />
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cr-text-muted)', marginBottom: '0.3rem' }}>Media URL (optional)</label>
        <input
          style={{ ...inputStyle, marginBottom: '1rem' }}
          value={strEditMediaUrlState}
          onChange={(e) => setStrEditMediaUrlState(e.target.value)}
          placeholder="https://..."
        />
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handleSave}
            disabled={boolIsSavingState}
            className="verisphere-btn-primary"
            style={{ padding: '8px 18px', cursor: boolIsSavingState ? 'not-allowed' : 'pointer', opacity: boolIsSavingState ? 0.6 : 1 }}
          >
            {boolIsSavingState ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setBoolIsEditingState(false)}
            disabled={boolIsSavingState}
            className="verisphere-btn-outline"
            style={{ padding: '8px 18px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verisphere-detail-header" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', lineHeight: '1.25', marginBottom: '0.6rem', marginTop: 0,
          fontFamily: 'var(--cr-font-heading)', color: 'var(--cr-text-main)',
          letterSpacing: '-0.01em', fontWeight: 700,
        }}>
          {post.strTitle}
        </h1>
        {boolCanEdit && (
          <button
            onClick={openEdit}
            className="verisphere-btn-outline"
            style={{ flexShrink: 0, padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="verisphere-post-meta" style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span className="verisphere-community-badge" style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--cr-font-mono)', color: 'var(--cr-text-main)', whiteSpace: 'nowrap' }}>
          {post.strCommunityName || 'General'}
        </span>
        {post.strPostType && post.strPostType !== 'mixed' && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'capitalize', color: 'var(--cr-text-muted)', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-badge)', padding: '1px 8px' }}>
            {post.strPostType}
          </span>
        )}
        <span className="verisphere-author-badge" style={{ fontSize: '12px', color: 'var(--cr-text-muted)', whiteSpace: 'nowrap' }}>
          by {post.strAuthorUsername || 'user_' + post.objAuthor}
        </span>
      </div>

      <MarkdownContent
        content={`${strDisplayContent || ''}${boolNeedsCollapse && !boolIsExpandedState ? '...' : ''}`}
        style={{ marginBottom: boolNeedsCollapse ? '0.4rem' : undefined, color: 'var(--cr-text-main)' }}
      />
      {boolNeedsCollapse && (
        <button
          onClick={() => setBoolIsExpandedState(!boolIsExpandedState)}
          style={{ background: 'transparent', border: 'none', color: 'var(--cr-text-main)', cursor: 'pointer', padding: 0, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--cr-font-heading)', display: 'block', textDecoration: 'underline' }}
        >
          {boolIsExpandedState ? 'Read less' : 'Read more'}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <PostDetailReactions reactions={reactions} />
        <ReportButton contentType="post" contentId={post.id} boolIsLoggedIn={boolIsLoggedIn} />
      </div>

      {post.strReferences && (
        <div className="verisphere-reasoning-box" style={{ backgroundColor: 'var(--cr-library-bg)', borderLeft: '3px solid var(--cr-library)', padding: '0.9rem 1rem', borderRadius: 'var(--cr-radius-input)', marginTop: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.4rem', color: 'var(--cr-text-main)', fontFamily: 'var(--cr-font-heading)', fontSize: '0.9rem' }}><span className="icon">📚</span> Topic Citations &amp; Sources</h4>
          <p className="reasoning-text" style={{ margin: 0, color: 'var(--cr-text-main)', fontSize: '0.88rem', lineHeight: 1.5 }}>{post.strReferences}</p>
        </div>
      )}
    </div>
  );
};

PostDetailHeader.propTypes = {
  post: PropTypes.object.isRequired,
  reactions: PropTypes.object.isRequired,
  boolCanEdit: PropTypes.bool,
  onSave: PropTypes.func,
  boolIsLoggedIn: PropTypes.bool,
};

export default PostDetailHeader;
