import React from 'react';
import PropTypes from 'prop-types';

// The mission framing from the platform design doc (section 1) - rendered on
// every AI analysis so "not absolute truth" is never buried in a terms page.
const MISSION_FOOTER = 'Our rating is not absolute truth - it is the closest reading we are willing to publicly settle for.';

const parseResult = (strJson) => {
  try { return JSON.parse(strJson) || {}; }
  catch { return {}; }
};

const AnalysisResponseBody = ({ comment, requestedBy }) => {
  const objResult = parseResult(comment.jsonAnalysisResult);
  const arrSources = objResult.suggested_sources || [];

  return (
    <div style={{
      background: 'var(--cr-surface-raised)', border: '1px solid var(--cr-border)',
      borderRadius: 'var(--cr-radius-input)', padding: '0.8rem', marginBottom: '0.8rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
          color: 'var(--cr-text-main)', border: '1px solid var(--cr-text-main)',
          borderRadius: 'var(--cr-radius-badge)', padding: '2px 8px', fontFamily: 'var(--cr-font-heading)',
        }}>
          AI analysis
        </span>
        {requestedBy && (
          <span style={{ fontSize: '0.75rem', color: 'var(--cr-text-muted)' }}>
            requested by {requestedBy}
          </span>
        )}
      </div>

      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--cr-text-main)' }}>
        {comment.strContent}
      </p>

      {objResult.decontextualization_risk && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--cr-text-muted)' }}>
          Out-of-context risk if screenshotted: {objResult.decontextualization_risk}
        </p>
      )}

      {arrSources.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          {arrSources.map((objSource, numIdx) => (
            <a key={numIdx} href={objSource.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', fontSize: '0.78rem', color: 'var(--cr-text-main)', textDecoration: 'underline' }}>
              {objSource.title}
            </a>
          ))}
        </div>
      )}

      <p style={{
        margin: '0.7rem 0 0', paddingTop: '0.5rem', borderTop: '1px solid var(--cr-border)',
        fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--cr-text-muted)',
      }}>
        {MISSION_FOOTER}
      </p>
    </div>
  );
};

AnalysisResponseBody.propTypes = {
  comment: PropTypes.object.isRequired,
  requestedBy: PropTypes.string,
};

export default AnalysisResponseBody;
