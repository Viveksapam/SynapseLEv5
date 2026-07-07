import React from 'react';
import PropTypes from 'prop-types';

const ComposerActions = ({ onCancel, boolCanSubmit, boolIsSubmitting }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
    <button type="button" onClick={onCancel}
      style={{ background: 'transparent', border: 'none', color: 'var(--cr-text-muted)', cursor: 'pointer', padding: '7px 14px', borderRadius: 'var(--cr-radius-input)', fontFamily: 'var(--cr-font-body)', fontSize: '13px' }}>
      Cancel
    </button>
    <button type="submit" disabled={boolIsSubmitting || !boolCanSubmit}
      style={{
        background: 'var(--cr-text-main)', color: 'var(--cr-bg)', border: 'none',
        padding: '7px 20px', borderRadius: 'var(--cr-radius-input)',
        cursor: boolCanSubmit ? 'pointer' : 'not-allowed', opacity: boolCanSubmit ? 1 : 0.4,
        fontFamily: 'var(--cr-font-heading)', fontSize: '13px', fontWeight: 600,
      }}>
      {boolIsSubmitting ? 'Posting...' : 'Post'}
    </button>
  </div>
);

ComposerActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  boolCanSubmit: PropTypes.bool,
  boolIsSubmitting: PropTypes.bool,
};

export default ComposerActions;
