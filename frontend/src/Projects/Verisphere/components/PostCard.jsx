import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { postToggleFeatured } from '../api/verisphereApi';
import { useReactions } from '../hooks/useReactions';
import MediaEmbed from './MediaEmbed';
import PostCardReactions from './PostCardReactions';
import MarkdownContent from './MarkdownContent';

const PostCard = ({ objPost, authHook }) => {
  const navigate = useNavigate();
  const { objUserState, strTokenState, boolIsLoggedInState } = authHook || {};
  const boolIsAdmin = !!(objUserState && (objUserState.is_superuser || objUserState.is_staff));
  const [boolIsFeaturedState, setBoolIsFeaturedState] = useState(objPost.boolIsFeatured);
  const reactions = useReactions(objPost.id, boolIsLoggedInState);

  const handleCardClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    navigate(`/verisphere/post/${objPost.id}`);
  };

  const handleToggleFeatured = async (e) => {
    e.stopPropagation();
    if (!boolIsAdmin) return;
    const boolSuccess = await postToggleFeatured(objPost.id, boolIsFeaturedState, strTokenState);
    if (boolSuccess) {
      setBoolIsFeaturedState((prev) => !prev);
      alert(boolIsFeaturedState ? 'Post removed from featured list.' : 'Post featured successfully!');
    } else {
      alert('Failed to toggle featured status. Please check your permissions.');
    }
  };

  const strRegister = objPost.strCommunityRegister === 'lounge' ? 'lounge' : 'library';
  const strRegisterColor = `var(--cr-${strRegister})`;

  return (
    <div className="verisphere-post-card" onClick={handleCardClick} style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
      <div className="vs-post-votes" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2px', gap: '1rem', minWidth: '52px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} title="Engagement (Views)">
          <span className="verisphere-vote-count" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--cr-font-mono)' }}>{objPost.numUpvotes}</span>
          <span className="verisphere-vote-label" style={{ fontSize: '9.5px', color: 'var(--cr-text-muted)', display: 'block', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--cr-font-mono)', marginTop: '2px' }}>Engagement</span>
        </div>
      </div>

      <div className="verisphere-post-content">
        <div className="verisphere-post-meta">
          <Link to={`/verisphere/community/${objPost.objCommunity || 'general'}`} className="verisphere-community-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--cr-font-mono)', color: 'var(--cr-text-main)', whiteSpace: 'nowrap' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: strRegisterColor, display: 'inline-block' }} />
            {objPost.strCommunityName || 'General'}
          </Link>
          {objPost.strPostType && objPost.strPostType !== 'mixed' && (
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-badge)', padding: '1px 8px', whiteSpace: 'nowrap' }}>
              {objPost.strPostType}
            </span>
          )}
          <span className="verisphere-author-badge" style={{ fontSize: '12px', color: 'var(--cr-text-muted)', whiteSpace: 'nowrap' }}>by {objPost.strAuthorUsername || 'user_' + objPost.objAuthor}</span>
          <span className="verisphere-date" style={{ fontSize: '12px', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)', whiteSpace: 'nowrap' }}>{new Date(objPost.created_at).toLocaleDateString()}</span>
          {boolIsAdmin && (
            <button onClick={handleToggleFeatured} style={{ marginLeft: 'auto', background: boolIsFeaturedState ? '#d29922' : 'transparent', color: boolIsFeaturedState ? '#161b22' : 'var(--cr-text-muted)', border: `1px solid ${boolIsFeaturedState ? '#d29922' : 'var(--cr-border)'}`, borderRadius: 'var(--cr-radius-badge)', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
              {boolIsFeaturedState ? '⭐ Featured' : '☆ Feature'}
            </button>
          )}
        </div>

        <Link to={`/verisphere/post/${objPost.id}`} className="verisphere-post-title-link">
          <h3 className="verisphere-post-title">{objPost.strTitle}</h3>
        </Link>

        <MediaEmbed strMediaUrl={objPost.strMediaUrl} numMaxImageHeight={315} numIframeHeight={350} />

        <MarkdownContent
          content={objPost.strContent.length > 200 ? objPost.strContent.substring(0, 200) + '...' : objPost.strContent}
          style={{ fontSize: '14px', color: 'var(--cr-text-muted)' }}
        />

        <PostCardReactions reactions={reactions} commentsCount={objPost.comments_count || 0} postId={objPost.id} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)', whiteSpace: 'nowrap' }}>
            {objPost.sources_count || 0} sources
          </span>
          <Link to={`/verisphere/post/${objPost.id}`} className="verisphere-btn-outline" style={{ padding: '2px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            + Add Source
          </Link>
        </div>
      </div>
    </div>
  );
};

PostCard.propTypes = {
  objPost: PropTypes.object.isRequired,
  authHook: PropTypes.object,
};

export default PostCard;
