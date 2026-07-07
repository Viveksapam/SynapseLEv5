import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { buildIframeSrcDoc } from '../../utils/sandboxCss';

const buildIframeStyle = (strViewport, objContainerSize) => {
  const numTargetWidth = strViewport === 'desktop' ? 1280 : 375;
  const numTargetHeight = strViewport === 'desktop' ? 720 : 667;
  const numPad = 32;
  const numScaleX = objContainerSize.numWidth > numPad ? (objContainerSize.numWidth - numPad) / numTargetWidth : 0.1;
  const numScaleY = objContainerSize.numHeight > numPad ? (objContainerSize.numHeight - numPad) / numTargetHeight : 0.1;
  const numScale = Math.max(0.1, Math.min(numScaleX, numScaleY, 1));
  return {
    width: `${numTargetWidth}px`, height: `${numTargetHeight}px`,
    transform: `scale(${numScale})`, transformOrigin: 'center center',
    position: 'absolute', left: '50%', top: '50%',
    marginLeft: `-${numTargetWidth / 2}px`, marginTop: `-${numTargetHeight / 2}px`,
    borderRadius: strViewport === 'mobile' ? '36px' : '16px',
    border: '12px solid var(--sle-bg-darker, #0f172a)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    overflow: 'hidden', backgroundColor: '#0f172a',
  };
};

const SandboxPreview = ({ strHtmlContent, strCssCode, strViewport, onViewportChange }) => {
  const previewRef = useRef(null);
  const [objContainerSize, setObjContainerSize] = useState({ numWidth: 800, numHeight: 450 });

  useEffect(() => {
    if (!previewRef.current) return;
    const observer = new ResizeObserver((arrEntries) => {
      for (const objEntry of arrEntries) {
        setObjContainerSize({ numWidth: objEntry.contentRect.width, numHeight: objEntry.contentRect.height });
      }
    });
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sandbox-render-station">
      <div className="sandbox-render-header">
        <span className="title-text">Live Render</span>
        <div className="viewport-toggles">
          <button className={`viewport-btn ${strViewport === 'desktop' ? 'active' : ''}`} onClick={() => onViewportChange('desktop')}>
            PC (16:9)
          </button>
          <button className={`viewport-btn ${strViewport === 'mobile' ? 'active' : ''}`} onClick={() => onViewportChange('mobile')}>
            Mobile
          </button>
        </div>
      </div>

      <div className="preview-container" ref={previewRef}>
        <div style={buildIframeStyle(strViewport, objContainerSize)}>
          <iframe
            srcDoc={buildIframeSrcDoc(strHtmlContent, strCssCode)}
            title="Live Render Sandbox"
            sandbox="allow-scripts allow-same-origin"
            className="sandbox-iframe"
          />
        </div>
      </div>
    </div>
  );
};

SandboxPreview.propTypes = {
  strHtmlContent: PropTypes.string.isRequired,
  strCssCode: PropTypes.string.isRequired,
  strViewport: PropTypes.string.isRequired,
  onViewportChange: PropTypes.func.isRequired,
};

export default SandboxPreview;
