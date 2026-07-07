import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatAnalyzedAt } from '../utils/formatAnalyzedAt';
import AnalysisResponseBody from './AnalysisResponseBody';
import ReportButton from './ReportButton';

const reasoningBox = (strBg) => ({ background: strBg, padding: '0.6rem 0.8rem', borderRadius: '6px' });
const labelStyle = { fontSize: '0.7rem', color: 'var(--cr-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '1px' };

const CommentBody = ({ comment, loadingCommentsState, onAnalyze, onStartReply, onDelete, boolIsLoggedIn, strRequesterName }) => {
  const [boolIsAnalysisExpandedState, setBoolIsAnalysisExpandedState] = useState(false);

  if (comment.strType === 'analysis_response') {
    return (
      <>
        <AnalysisResponseBody comment={comment} requestedBy={strRequesterName} />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <button
            className="verisphere-btn-outline"
            onClick={() => onStartReply(comment.id)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--cr-text-muted)' }}
          >
            + Reply
          </button>
        </div>
      </>
    );
  }

  const objMetrics = comment.dictAiMetrics;
  const arrFallacies = objMetrics?.logical_errors || [];
  const boolHasAnalysis = comment.strAiAnalysis || objMetrics;
  const strAnalyzedAt = formatAnalyzedAt(objMetrics?.analyzed_at);

  return (
    <>
      {arrFallacies.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {arrFallacies.map((strErr, numIdx) => (
            <span key={numIdx} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--cr-danger)', padding: '2px 8px', borderRadius: 'var(--cr-radius-chip)', fontSize: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠️ {strErr}
            </span>
          ))}
        </div>
      )}

      <p className="verisphere-comment-text" style={{ fontSize: '0.875rem', lineHeight: '1.4', color: 'var(--cr-text-main)', marginBottom: '0.6rem', marginTop: 0 }}>
        {comment.strContent}
      </p>

      <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.8rem' }}>
        {comment.strAnalysisReasoning && (
          <div className="verisphere-reasoning-box" style={reasoningBox('var(--cr-surface-raised)')}>
            <strong style={labelStyle}>🧠 Logical Foundation</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cr-text-main)' }}>{comment.strAnalysisReasoning}</p>
          </div>
        )}
        {comment.strReferences && (
          <div className="verisphere-reasoning-box" style={reasoningBox('var(--cr-library-bg)')}>
            <strong style={labelStyle}>📚 Citations</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cr-text-main)' }}>{comment.strReferences}</p>
          </div>
        )}
        {boolHasAnalysis && (
          <div className="verisphere-ai-box comment-ai" style={{ ...reasoningBox('var(--cr-surface-raised)'), padding: 0, border: '1px solid var(--cr-border)' }}>
            <button
              onClick={() => setBoolIsAnalysisExpandedState(!boolIsAnalysisExpandedState)}
              style={{
                width: '100%', padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center',
                gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', color: 'var(--cr-text-main)', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--cr-text-muted)', minWidth: '0.9rem' }}>
                {boolIsAnalysisExpandedState ? '▼' : '▶'}
              </span>
              <span>
                <strong style={{ ...labelStyle, margin: 0, marginBottom: 0, display: 'inline', textTransform: 'capitalize' }}>
                  📊 Analysis
                </strong>
              </span>
            </button>
            {boolIsAnalysisExpandedState && (
              <div style={{ padding: '0 0.8rem 0.6rem 0.8rem', borderTop: '1px solid var(--cr-border)' }}>
                {strAnalyzedAt && (
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.7rem', color: 'var(--cr-text-muted)' }}>
                    Analyzed {strAnalyzedAt}
                  </p>
                )}
                {comment.strAiAnalysis && (
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--cr-text-main)', lineHeight: '1.4' }}>
                    {comment.strAiAnalysis}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          {!comment.strAiAnalysis && boolIsLoggedIn && (comment.strType || 'standard') === 'standard' && (
            <button
              onClick={() => onAnalyze(comment.id)}
              disabled={loadingCommentsState[comment.id]}
              className="verisphere-btn-outline small"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px' }}
            >
              {loadingCommentsState[comment.id] ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
          <button
            className="verisphere-btn-outline"
            onClick={() => onStartReply(comment.id)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--cr-text-muted)' }}
          >
            + Reply
          </button>
          {onDelete && (
            <button
              className="verisphere-btn-outline"
              onClick={() => onDelete(comment.id)}
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--cr-text-muted)' }}
            >
              Delete
            </button>
          )}
          <ReportButton contentType="comment" contentId={comment.id} boolIsLoggedIn={boolIsLoggedIn} />
        </div>
      </div>
    </>
  );
};

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  loadingCommentsState: PropTypes.object.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  onStartReply: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  boolIsLoggedIn: PropTypes.bool,
  strRequesterName: PropTypes.string,
};

export default CommentBody;
