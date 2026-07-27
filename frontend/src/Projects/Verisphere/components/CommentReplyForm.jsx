import React from 'react';
import PropTypes from 'prop-types';

const CommentReplyForm = ({ commentId, value, onChange, onSubmit, onCancel, isSubmitting }) => (
  <form
    onSubmit={(e) => onSubmit(e, commentId)}
    className="verisphere-comment-form"
    style={{ marginTop: '1rem', paddingLeft: '1rem', marginBottom: '1rem' }}
  >
    <textarea
      placeholder="Share your thoughts clearly..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="verisphere-textarea"
      style={{ minHeight: '60px', marginBottom: '0.5rem', fontSize: '0.85rem' }}
    />
    <div className="verisphere-form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        type="submit"
        disabled={isSubmitting}
        className="verisphere-btn-primary"
        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      <button type="button" onClick={onCancel} className="verisphere-btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
        Cancel
      </button>
    </div>
  </form>
);

CommentReplyForm.propTypes = {
  commentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};

export default CommentReplyForm;
