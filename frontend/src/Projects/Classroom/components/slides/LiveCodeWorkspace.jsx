import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../../../utils/sanitize';
import { SyntaxHighlighter } from './SyntaxHighlighter';

const LiveCodeWorkspace = ({ strCssCode, onCssCodeChange, strHtmlContent, boolIsSuccess, onClearFeedback }) => {
  const preRef = useRef(null);

  return (
    <div className="live-code-workspace">
      <div className="editor-pane">
        <div className="pane-header">STYLE.CSS</div>
        <div className="code-editor-container">
          <pre className="code-editor-highlight" ref={preRef} aria-hidden="true">
            <SyntaxHighlighter code={strCssCode + (strCssCode.endsWith('\n') ? ' ' : '')} language="css" />
          </pre>
          <textarea
            className="code-editor"
            value={strCssCode}
            onChange={(e) => {
              onCssCodeChange(e.target.value);
              if (onClearFeedback) onClearFeedback();
            }}
            onScroll={(e) => {
              if (preRef.current) {
                preRef.current.scrollTop = e.target.scrollTop;
                preRef.current.scrollLeft = e.target.scrollLeft;
              }
            }}
            spellCheck="false"
            disabled={boolIsSuccess}
          />
        </div>
      </div>

      <div className="preview-pane">
        <div className="pane-header">LIVE_PREVIEW</div>
        <div className="preview-content">
          <style>{`
            .preview-sandbox { all: initial; font-family: sans-serif; display: block; width: 100%; height: 100%; }
            ${strCssCode}
          `}</style>
          <div className="preview-sandbox" dangerouslySetInnerHTML={{ __html: sanitizeHTML(strHtmlContent) }} />
        </div>
      </div>
    </div>
  );
};

LiveCodeWorkspace.propTypes = {
  strCssCode: PropTypes.string.isRequired,
  onCssCodeChange: PropTypes.func.isRequired,
  strHtmlContent: PropTypes.string,
  boolIsSuccess: PropTypes.bool.isRequired,
  onClearFeedback: PropTypes.func,
};

export default LiveCodeWorkspace;
