import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useReactions } from '../hooks/useReactions';
import { usePostDetail } from '../hooks/usePostDetail';
import PostDetailHeader from '../components/PostDetailHeader';
import PostDetailSources from '../components/PostDetailSources';
import PostDetailContext from '../components/PostDetailContext';
import AnalysisLoadingOverlay from '../components/AnalysisLoadingOverlay';
import { countAllComments } from '../utils/commentCounter';
import '../styles/VeriSphere.css';

const PostDetailPage = ({ authHook }) => {
  const { id } = useParams();
  const fallbackAuth = useAuth();
  const { strTokenState, boolIsLoggedInState, objUserState } = authHook || fallbackAuth;
  const boolIsAdmin = !!(objUserState && (objUserState.is_superuser || objUserState.is_staff));
  const reactions = useReactions(id, boolIsLoggedInState);
  const post = usePostDetail(id, strTokenState, boolIsLoggedInState);
  const [numWindowWidth, setNumWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setNumWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [boolIsAddingSourceState, setBoolIsAddingSourceState] = useState(false);
  const [strNewSourceTitleState, setStrNewSourceTitleState] = useState('');
  const [strNewSourceUrlState, setStrNewSourceUrlState] = useState('');
  const [strNewSourceDescState, setStrNewSourceDescState] = useState('');
  const [boolIsSubmittingSourceState, setBoolIsSubmittingSourceState] = useState(false);

  const handleSourceSubmit = async (e) => {
    e.preventDefault();
    if (!strNewSourceTitleState.trim() || !strNewSourceUrlState.trim()) return;
    setBoolIsSubmittingSourceState(true);
    try {
      await post.submitSource({ strTitle: strNewSourceTitleState, strUrl: strNewSourceUrlState, strDescription: strNewSourceDescState, strAuthor: objUserState?.username });
      setStrNewSourceTitleState(''); setStrNewSourceUrlState(''); setStrNewSourceDescState('');
      setBoolIsAddingSourceState(false);
    } catch (objErr) { alert(objErr.message || 'Failed to submit source.'); }
    finally { setBoolIsSubmittingSourceState(false); }
  };

  if (post.boolIsLoadingState) return null;
  if (!post.objPostState) return <div className="verisphere-empty-state">Post not found.</div>;

  return (
    <>
      <AnalysisLoadingOverlay
        boolIsVisible={post.boolIsAnalyzingPostState}
        strPhase={post.strAnalysisPhaseState}
      />
      <div className="verisphere-post-detail" style={{
      maxWidth: '760px', margin: '20px auto', padding: '24px 28px 28px',
      background: 'var(--cr-surface)', border: '1px solid var(--cr-border)',
      borderRadius: 'var(--cr-radius-card)', boxShadow: 'var(--cr-shadow-card)',
      fontSize: '0.95rem',
      lineHeight: '1.6',
    }}>
      <PostDetailHeader
        post={post.objPostState}
        reactions={reactions}
        boolCanEdit={boolIsAdmin || (boolIsLoggedInState && post.objPostState.strAuthorUsername === objUserState?.username)}
        onSave={post.updatePost}
        boolIsLoggedIn={boolIsLoggedInState}
      />

      <PostDetailSources
        postId={id}
        post={post.objPostState}
        sourceForm={{
          boolIsAddingSourceState, strNewSourceTitleState, setStrNewSourceTitleState,
          strNewSourceUrlState, setStrNewSourceUrlState,
          strNewSourceDescState, setStrNewSourceDescState, boolIsSubmittingSourceState,
        }}
        onSourceSubmit={handleSourceSubmit}
        onToggleAdd={() => setBoolIsAddingSourceState(!boolIsAddingSourceState)}
        boolIsAdmin={boolIsAdmin}
        strToken={strTokenState}
        onSourceApproved={post.refetch}
      />

      <PostDetailContext
        post={post.objPostState}
        onAnalyze={() => post.analyzePost()}
        boolIsAnalyzing={post.boolIsAnalyzingPostState}
        boolIsLoggedIn={boolIsLoggedInState}
      />

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
        <Link
          to={`/verisphere/post/${id}/comments`}
          className="verisphere-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '10px 20px', fontSize: '0.95rem', textDecoration: 'none' }}
        >
          View Discussion ({countAllComments(post.objPostState.comments)} comments)
        </Link>
      </div>
    </div>
    </>
  );
};

export default PostDetailPage;
