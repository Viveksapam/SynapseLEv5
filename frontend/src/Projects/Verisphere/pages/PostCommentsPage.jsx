import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { usePostDetail } from '../hooks/usePostDetail';
import PostDetailComments from '../components/PostDetailComments';
import '../styles/VeriSphere.css';

const PostCommentsPage = ({ authHook }) => {
  const { id } = useParams();
  const fallbackAuth = useAuth();
  const { strTokenState, boolIsLoggedInState, objUserState } = authHook || fallbackAuth;
  const boolIsAdmin = !!(objUserState && (objUserState.is_superuser || objUserState.is_staff));
  const post = usePostDetail(id, strTokenState, boolIsLoggedInState);

  const [strNewCommentState, setStrNewCommentState] = useState('');
  const [boolIsSubmittingState, setBoolIsSubmittingState] = useState(false);
  const [replyingToState, setReplyingToState] = useState(null);
  const [replyModeState, setReplyModeState] = useState(null);
  const [strReplyContentState, setStrReplyContentState] = useState('');
  const [boolIsSubmittingReplyState, setBoolIsSubmittingReplyState] = useState(false);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!strNewCommentState.trim()) return;
    setBoolIsSubmittingState(true);
    try {
      await post.submitComment({ strContent: strNewCommentState });
      setStrNewCommentState('');
    } catch { alert('Failed to submit comment. Please ensure you are logged in.'); }
    finally { setBoolIsSubmittingState(false); }
  };

  const handleReplySubmit = async (e, numParentId) => {
    e.preventDefault();
    if (!strReplyContentState.trim()) return;
    setBoolIsSubmittingReplyState(true);
    try {
      await post.submitComment({ strContent: strReplyContentState, objParent: numParentId });
      setStrReplyContentState('');
      setReplyingToState(null); setReplyModeState(null);
    } catch { alert('Failed to submit reply. Please ensure you are logged in.'); }
    finally { setBoolIsSubmittingReplyState(false); }
  };

  if (post.boolIsLoadingState) return null;
  if (!post.objPostState) return <div className="verisphere-empty-state">Post not found.</div>;

  return (
    <div className="verisphere-post-detail" style={{
      maxWidth: '760px', margin: '20px auto', padding: '24px 28px 28px',
      background: 'var(--cr-surface)', border: '1px solid var(--cr-border)',
      borderRadius: 'var(--cr-radius-card)', boxShadow: 'var(--cr-shadow-card)',
      fontSize: '0.95rem', lineHeight: '1.6',
    }}>
      <PostDetailComments
        post={post.objPostState}
        boolIsLoggedIn={boolIsLoggedInState}
        boolIsAdmin={boolIsAdmin}
        commentForm={{
          strNewCommentState, setStrNewCommentState,
          boolIsSubmittingState, onCommentSubmit: handleCommentSubmit,
        }}
        replyState={{
          // Logged-out users get the login modal instead of a reply composer
          // (same open-login event the reactions flow uses).
          setReplyingToState: (numId) => {
            if (!boolIsLoggedInState) { window.dispatchEvent(new CustomEvent('open-login')); return; }
            setReplyingToState(numId);
          },
          setReplyModeState, setStrReplyContentState,
          replyingToState, replyModeState, strReplyContentState,
          handleReplySubmit, boolIsSubmittingReplyState,
          handleDeleteComment: boolIsAdmin ? post.handleDeleteComment : undefined,
        }}
        onAnalyzeComment={post.analyzeComment}
        loadingComments={post.loadingCommentsState}
      />
    </div>
  );
};

export default PostCommentsPage;
