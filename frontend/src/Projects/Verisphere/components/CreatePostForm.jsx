import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPost } from '../api/postApi';
import { fetchCommunities } from '../api/communityApi';
import { useAuth } from '../../../hooks/useAuth';
import PostTypePicker, { surfaceFor } from './PostTypePicker';
import ComposerAnalysisControls from './ComposerAnalysisControls';
import MarkdownToolbar from './MarkdownToolbar';
import MarkdownContent from './MarkdownContent';
import ComposerActions from './ComposerActions';

const fieldStyle = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--cr-border)', color: 'var(--cr-text-main)',
  padding: '8px 0', outline: 'none',
  fontFamily: 'var(--cr-font-body)', fontSize: '13px', boxSizing: 'border-box',
};

// One composer, one data model. The post type is the opening choice and drives
// which surface unfolds (light / text-forward / full). Switching type never
// loses the draft - it only changes what is shown.
const CreatePostForm = ({ numCommunityId = null, onPostCreated }) => {
  const { boolIsLoggedInState } = useAuth();
  const refTextarea = useRef(null);
  const [strTypeState, setStrTypeState] = useState('musing');
  const [strTitleState, setStrTitleState] = useState('');
  const [strContentState, setStrContentState] = useState('');
  const [strReferencesState, setStrReferencesState] = useState('');
  const [strMediaUrlState, setStrMediaUrlState] = useState('');
  const [numDestinationState, setNumDestinationState] = useState(numCommunityId || '');
  const [arrCommunitiesState, setArrCommunitiesState] = useState([]);
  const [strModeState, setStrModeState] = useState('open');
  const [arrLensesState, setArrLensesState] = useState([]);
  const [boolShowToolbarState, setBoolShowToolbarState] = useState(false);
  const [boolPreviewState, setBoolPreviewState] = useState(false);
  const [boolIsSubmittingState, setBoolIsSubmittingState] = useState(false);
  const [boolIsExpandedState, setBoolIsExpandedState] = useState(false);

  useEffect(() => {
    if (!numCommunityId) fetchCommunities().then((arr) => setArrCommunitiesState(arr.filter((c) => c.joined)));
  }, [numCommunityId]);

  const strSurface = surfaceFor(strTypeState);
  // Formatting is available on EVERY post type - the full surface shows the
  // toolbar upfront, lighter surfaces keep it one "Formatting" tap away.
  const boolShowEditorTools = strSurface === 'full' || boolShowToolbarState;
  const boolCanSubmit = strTitleState.trim() && strContentState.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boolCanSubmit) return;
    setBoolIsSubmittingState(true);
    try {
      await createPost({
        strTitle: strTitleState, strContent: strContentState,
        strReferences: strSurface === 'full' ? strReferencesState : '',
        strMediaUrl: strMediaUrlState || null,
        community_id: numDestinationState ? parseInt(numDestinationState, 10) : null,
        strPostType: strTypeState,
        strAnalysisMode: strModeState,
        allowed_analysis_focus: strModeState === 'limited' ? arrLensesState : null,
      });
      setStrTitleState(''); setStrContentState(''); setStrReferencesState('');
      setStrMediaUrlState(''); setBoolIsExpandedState(false); setBoolPreviewState(false);
      if (onPostCreated) onPostCreated();
    } catch (objErr) {
      alert(objErr.message || 'Failed to publish.');
    } finally {
      setBoolIsSubmittingState(false);
    }
  };

  if (!boolIsLoggedInState) return null;

  return (
    <div style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-card)', boxShadow: 'var(--cr-shadow-card)', padding: '16px 18px', marginBottom: '22px' }}>
      {!boolIsExpandedState ? (
        <button
          type="button"
          onClick={() => setBoolIsExpandedState(true)}
          style={{
            width: '100%', textAlign: 'left', background: 'var(--cr-surface-raised)',
            border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-chip)',
            padding: '10px 16px', color: 'var(--cr-text-muted)', fontSize: '14px',
            fontFamily: 'var(--cr-font-body)', cursor: 'pointer',
          }}
        >
          Share something with the community...
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PostTypePicker value={strTypeState} onChange={setStrTypeState} />
          <input
            type="text" placeholder="Title" value={strTitleState}
            onChange={(e) => setStrTitleState(e.target.value)} required autoFocus
            style={{ ...fieldStyle, fontSize: '17px', fontWeight: 600, fontFamily: 'var(--cr-font-heading)' }}
          />
          {boolShowEditorTools && (
            <MarkdownToolbar
              textareaRef={refTextarea} value={strContentState} onChange={setStrContentState}
              boolShowPreview={boolPreviewState} onTogglePreview={() => setBoolPreviewState(!boolPreviewState)}
            />
          )}
          {boolPreviewState ? (
            <MarkdownContent content={strContentState} style={{ minHeight: '72px', fontSize: '13.5px', color: 'var(--cr-text-main)' }} />
          ) : (
            <textarea
              ref={refTextarea}
              placeholder={strSurface === 'light' ? 'Say it as it comes...' : 'State your ideas...'}
              value={strContentState}
              onChange={(e) => setStrContentState(e.target.value)} required
              style={{ ...fieldStyle, minHeight: '72px', resize: 'vertical', lineHeight: '1.6' }}
            />
          )}
          {strSurface !== 'full' && !boolShowToolbarState && (
            <button type="button" onClick={() => setBoolShowToolbarState(true)}
              style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--cr-text-muted)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}>
              Formatting
            </button>
          )}
          {strSurface === 'full' && (
            <input type="text" placeholder="Sources and links (encouraged, never required)" value={strReferencesState} onChange={(e) => setStrReferencesState(e.target.value)} style={fieldStyle} />
          )}
          <input type="url" placeholder="Media URL (optional)" value={strMediaUrlState} onChange={(e) => setStrMediaUrlState(e.target.value)} style={fieldStyle} />
          {!numCommunityId && (
            <select value={numDestinationState} onChange={(e) => setNumDestinationState(e.target.value)}
              style={{ ...fieldStyle, cursor: 'pointer' }} aria-label="Post destination">
              <option value="">My profile (general feed)</option>
              {arrCommunitiesState.map((c) => <option key={c.id} value={c.id}>{c.strName}</option>)}
            </select>
          )}
          <ComposerAnalysisControls
            mode={strModeState} onModeChange={setStrModeState}
            allowedLenses={arrLensesState} onLensesChange={setArrLensesState}
            compact={strSurface === 'light'}
          />
          <ComposerActions onCancel={() => setBoolIsExpandedState(false)} boolCanSubmit={!!boolCanSubmit} boolIsSubmitting={boolIsSubmittingState} />
        </form>
      )}
    </div>
  );
};

CreatePostForm.propTypes = {
  numCommunityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onPostCreated: PropTypes.func,
};

export default CreatePostForm;
