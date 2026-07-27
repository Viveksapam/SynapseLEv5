import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../../../utils/sanitize';
import './ContentSlide.css';
import { TabsBlock } from './TabsBlock';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { InlineQuiz } from './InlineQuiz';
import { InteractiveSandbox } from './InteractiveSandbox';

const parseMD = (text) => {
  if (typeof text !== 'string') return text;
  return sanitizeHTML(
    text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
  );
};

export function ContentSlide({ data }) {
  const iframeRefs = React.useRef(new Map());

  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'sandbox-resize') {
        for (let iframe of iframeRefs.current.values()) {
          if (iframe && iframe.contentWindow === e.source) {
            iframe.style.height = (e.data.height + 40) + 'px';
            break;
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const renderBlock = (block, index) => {
    switch(block.type) {
      case 'paragraph':
        return <p key={index} className="slide-paragraph" dangerouslySetInnerHTML={{ __html: parseMD(block.text) }} />;
      case 'code':
        return (
          <pre key={index} className="slide-code-block">
            <SyntaxHighlighter code={block.code} language={block.language || 'css'} />
          </pre>
        );
      case 'list':
        return (
          <ul key={index} className="slide-list">
            {block.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: parseMD(item) }} />)}
          </ul>
        );
      case 'heading':
        return <h3 key={index} className="slide-heading cyan-text" dangerouslySetInnerHTML={{ __html: parseMD(block.text) }} />;
      case 'image':
        return (
          <div key={index} className="slide-image-wrapper">
            <img src={block.url} alt={block.alt} className="slide-image" />
            {block.caption && <p className="slide-image-caption" dangerouslySetInnerHTML={{ __html: parseMD(block.caption) }} />}
          </div>
        );
      case 'tabs':
        return <TabsBlock key={index} tabs={block.tabs} />;
      case 'callout':
        return (
          <div key={index} className={`slide-callout callout-${block.variant || 'info'}`}>
            <span className="callout-icon">{block.variant === 'warning' ? '⚠' : block.variant === 'tip' ? '💡' : 'ℹ'}</span>
            <p dangerouslySetInnerHTML={{ __html: parseMD(block.text) }} />
          </div>
        );
      case 'accordion':
        return (
          <details key={index} className="slide-accordion">
            <summary className="accordion-summary">{parseMD(block.summary)}</summary>
            <div className="accordion-content" dangerouslySetInnerHTML={{ __html: parseMD(block.content) }} />
          </details>
        );
      case 'sandbox':
        return (
          <InteractiveSandbox key={index} htmlContent={block.html} initialCss={block.css} />
        );
      case 'inline_quiz':
        return <InlineQuiz key={index} block={block} />;
      default:
        return null;
    }
  };

  return (
    <div className={`slide-container ${data.celebration ? 'celebration-active' : ''}`}>
      {data.celebration && <div className="celebration-overlay" />}
      <h2 className="slide-title cyan-text">{data.title}</h2>
      <div className="slide-body">
        {data.contentBlocks 
          ? data.contentBlocks.map(renderBlock)
          : <p className="slide-paragraph">{data.content}</p>
        }
      </div>
    </div>
  );
}

ContentSlide.propTypes = {
  data: PropTypes.object.isRequired,
};

