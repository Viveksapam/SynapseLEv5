import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatAnalyzedAt } from '../utils/formatAnalyzedAt';

const SUB_SCORE_LABELS = {
  clarity_falsifiability: 'Clarity & Falsifiability',
  premise_support: 'Premise Support',
  inferential_validity: 'Inferential Validity',
  source_reliability: 'Source Reliability',
  fallacy_bias_freedom: 'Fallacy & Bias Freedom',
};

const scoreColor = (score) => {
  if (score <= 20) return '#ef4444';
  if (score <= 40) return '#f59e0b';
  if (score <= 60) return '#eab308';
  if (score <= 80) return '#84cc16';
  return '#22c55e';
};

const SubScoreBar = ({ label, score, rationale }) => (
  <div style={{ marginBottom: '0.7rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
      <span style={{ color: 'var(--cr-text-main)' }}>{label}</span>
      <span style={{ color: scoreColor(score), fontWeight: 'bold' }}>{score}/100</span>
    </div>
    <div style={{ height: '5px', background: 'var(--cr-border)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', background: scoreColor(score) }} />
    </div>
    {rationale && (
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--cr-text-muted)', lineHeight: '1.4' }}>{rationale}</p>
    )}
  </div>
);

SubScoreBar.propTypes = {
  label: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  rationale: PropTypes.string,
};

const PostDetailContext = ({ post, onAnalyze, boolIsAnalyzing, boolIsLoggedIn }) => {
  const [boolIsMobileState, setBoolIsMobileState] = useState(window.innerWidth < 768);
  const [boolIsPostAnalysisExpandedState, setBoolIsPostAnalysisExpandedState] = useState(false);

  useEffect(() => {
    const handleResize = () => setBoolIsMobileState(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const boolHasPostAnalysis = post?.ai_summary;
  const objDetail = post?.analysis_detail || null;
  const arrSubScores = objDetail?.sub_scores ? Object.entries(objDetail.sub_scores) : [];
  const arrFallacies = objDetail?.detected_fallacies || [];
  const strAnalyzedAt = formatAnalyzedAt(post?.analyzed_at);

  return (
    <div className="verisphere-post-analysis-section" style={{ marginTop: '2rem' }}>
      {boolHasPostAnalysis && (
        <div
          className="verisphere-ai-box"
          onClick={() => setBoolIsPostAnalysisExpandedState(!boolIsPostAnalysisExpandedState)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setBoolIsPostAnalysisExpandedState(!boolIsPostAnalysisExpandedState);
            }
          }}
          aria-expanded={boolIsPostAnalysisExpandedState}
          style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--cr-border)', borderRadius: '8px', backgroundColor: 'var(--cr-surface-raised)', cursor: 'pointer' }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: boolIsPostAnalysisExpandedState ? '0.8rem' : 0,
            }}
          >
            <span style={{ fontSize: '1.2rem', color: 'var(--cr-text-muted)', minWidth: '1.2rem' }}>
              {boolIsPostAnalysisExpandedState ? '▼' : '▶'}
            </span>
            <h4 style={{ margin: 0, color: 'var(--cr-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--cr-font-heading)', fontSize: '0.95rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📋</span> Post Analysis
            </h4>
          </div>
          {!boolIsPostAnalysisExpandedState && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--cr-text-muted)' }}>
              {post.ai_summary?.substring(0, 80)}...
            </p>
          )}
          {boolIsPostAnalysisExpandedState && (
            <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--cr-border)' }}>
              {strAnalyzedAt && (
                <p style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', color: 'var(--cr-text-muted)' }}>
                  Analyzed {strAnalyzedAt}
                </p>
              )}
              <div style={{ marginBottom: arrSubScores.length ? '1.2rem' : 0 }}>
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontWeight: '500' }}>AI Assessment</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--cr-text-main)', lineHeight: '1.5' }}>{post.ai_summary}</p>
              </div>

              {arrSubScores.length > 0 && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontWeight: '500' }}>Rubric Breakdown</p>
                  {arrSubScores.map(([strKey, objVal]) => (
                    <SubScoreBar
                      key={strKey}
                      label={SUB_SCORE_LABELS[strKey] || strKey}
                      score={Number(objVal?.score) || 0}
                      rationale={objVal?.rationale}
                    />
                  ))}
                </div>
              )}

              {arrFallacies.length > 0 && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontWeight: '500' }}>Detected Fallacies</p>
                  {arrFallacies.map((objF, numIdx) => (
                    <div key={numIdx} style={{ marginBottom: '0.6rem', paddingLeft: '0.6rem', borderLeft: '2px solid var(--cr-danger)' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cr-text-main)', fontWeight: '600' }}>{objF.name}</p>
                      {objF.quote && (
                        <p style={{ margin: '0.2rem 0', fontSize: '0.78rem', color: 'var(--cr-text-muted)', fontStyle: 'italic' }}>{objF.quote}</p>
                      )}
                      {objF.explanation && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--cr-text-muted)', lineHeight: '1.4' }}>{objF.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {objDetail?.steelman && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontWeight: '500' }}>Steelman</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cr-text-main)', lineHeight: '1.5' }}>{objDetail.steelman}</p>
                </div>
              )}

              {objDetail?.verification_pathway && (
                <div>
                  <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontWeight: '500' }}>Verification Pathway</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cr-text-main)', lineHeight: '1.5' }}>{objDetail.verification_pathway}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {boolIsLoggedIn && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--cr-border)' }}>
          <button
            onClick={onAnalyze}
            disabled={boolIsAnalyzing}
            className="verisphere-btn-primary"
            style={{
              fontSize: '0.85rem', padding: '6px 10px',
              background: boolIsAnalyzing ? 'transparent' : 'var(--cr-text-main)',
              color: boolIsAnalyzing ? 'var(--cr-text-muted)' : 'var(--cr-bg)',
              border: `1.5px solid ${boolIsAnalyzing ? 'var(--cr-border)' : 'var(--cr-text-main)'}`,
              borderRadius: 'var(--cr-radius-chip)', cursor: boolIsAnalyzing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--cr-font-heading)', fontWeight: 600,
              opacity: boolIsAnalyzing ? 0.6 : 1,
            }}
          >
            {boolIsAnalyzing ? '⊙ Analyzing...' : 'Analyze Post'}
          </button>
        </div>
      )}
    </div>
  );
};

PostDetailContext.propTypes = {
  post: PropTypes.object,
  onAnalyze: PropTypes.func,
  boolIsAnalyzing: PropTypes.bool,
  boolIsLoggedIn: PropTypes.bool,
};

export default PostDetailContext;
