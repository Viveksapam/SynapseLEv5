import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createReport } from '../api/reportApi';

// Small flag control shared by posts and comments - inline reason composer,
// same interaction shape as CommentReplyForm.
const ReportButton = ({ contentType, contentId, boolIsLoggedIn }) => {
  const [boolIsOpenState, setBoolIsOpenState] = useState(false);
  const [strReasonState, setStrReasonState] = useState('');
  const [boolIsSubmittingState, setBoolIsSubmittingState] = useState(false);
  const [strStatusState, setStrStatusState] = useState('');

  if (strStatusState) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--cr-text-muted)' }}>{strStatusState}</span>
    );
  }

  if (!boolIsOpenState) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!boolIsLoggedIn) { window.dispatchEvent(new CustomEvent('open-login')); return; }
          setBoolIsOpenState(true);
        }}
        className="verisphere-btn-outline"
        style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--cr-text-muted)' }}
      >
        Report
      </button>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strReasonState.trim()) return;
    setBoolIsSubmittingState(true);
    try {
      const objResult = await createReport(contentType, contentId, strReasonState.trim());
      setStrStatusState(objResult.message || 'Reported.');
    } catch (objErr) {
      alert(objErr.message || 'Failed to submit report.');
    } finally {
      setBoolIsSubmittingState(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Why are you reporting this?"
        value={strReasonState}
        onChange={(e) => setStrReasonState(e.target.value)}
        required
        maxLength={300}
        style={{
          fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px',
          border: '1px solid var(--cr-border)', background: 'transparent', color: 'var(--cr-text-main)',
          minWidth: '160px',
        }}
      />
      <button type="submit" disabled={boolIsSubmittingState} className="verisphere-btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px' }}>
        {boolIsSubmittingState ? 'Sending...' : 'Submit'}
      </button>
      <button
        type="button"
        onClick={() => setBoolIsOpenState(false)}
        style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--cr-text-muted)', cursor: 'pointer' }}
      >
        Cancel
      </button>
    </form>
  );
};

ReportButton.propTypes = {
  contentType: PropTypes.oneOf(['post', 'comment']).isRequired,
  contentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  boolIsLoggedIn: PropTypes.bool,
};

export default ReportButton;
