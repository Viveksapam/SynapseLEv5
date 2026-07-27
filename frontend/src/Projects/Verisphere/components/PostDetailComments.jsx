import React from 'react';
import PropTypes from 'prop-types';
import CommentThread from './CommentThread';

const PostDetailComments = ({
  post, boolIsLoggedIn, boolIsAdmin, commentForm, replyState, onAnalyzeComment, loadingComments,
}) => {
  const {
    strNewCommentState, setStrNewCommentState,
    boolIsSubmittingState, onCommentSubmit,
  } = commentForm;

  const arrComments = post.comments || [];

  return (
    <div className="verisphere-comments-section" style={{ marginTop: '1.5rem' }}>
      <div className="verisphere-add-comment" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--cr-border)' }}>
        <form onSubmit={onCommentSubmit} className="verisphere-comment-form" style={{ display: 'flex', flexDirection: 'column' }}>
          <textarea
            placeholder="Disagree and support with grace."
            value={strNewCommentState}
            onChange={(e) => setStrNewCommentState(e.target.value)}
            onFocus={() => !boolIsLoggedIn && window.dispatchEvent(new CustomEvent('open-login'))}
            required
            className="verisphere-textarea"
            style={{ minHeight: '80px', resize: 'vertical' }}
          />
          <div className="verisphere-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {boolIsLoggedIn && (
              <button
                type="submit"
                disabled={boolIsSubmittingState}
                className="verisphere-btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                {boolIsSubmittingState ? 'Submitting...' : 'Submit Comment'}
              </button>
            )}
          </div>
        </form>
      </div>

      {arrComments.length === 0 ? (
        <p className="verisphere-empty-comments" style={{ color: 'var(--cr-text-muted)', fontSize: '0.9rem', margin: 0 }}>No comments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {arrComments.map((objComment) => (
            <CommentThread
              key={objComment.id}
              comment={objComment}
              level={0}
              handleAnalyzeComment={onAnalyzeComment}
              loadingCommentsState={loadingComments}
              boolIsAdmin={boolIsAdmin}
              boolIsLoggedIn={boolIsLoggedIn}
              {...replyState}
            />
          ))}
        </div>
      )}
    </div>
  );
};

PostDetailComments.propTypes = {
  post: PropTypes.object.isRequired,
  boolIsLoggedIn: PropTypes.bool.isRequired,
  boolIsAdmin: PropTypes.bool,
  commentForm: PropTypes.object.isRequired,
  replyState: PropTypes.object.isRequired,
  onAnalyzeComment: PropTypes.func.isRequired,
  loadingComments: PropTypes.object.isRequired,
};

export default PostDetailComments;
