import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../../../utils/sanitize';
import './TabsBlock.css';
import { SyntaxHighlighter } from './SyntaxHighlighter';

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

export function TabsBlock({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tabs-block">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-btn ${index === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs[activeTab].blocks.map((block, i) => {
          switch (block.type) {
            case 'paragraph':
              return <p key={i} className="slide-paragraph" dangerouslySetInnerHTML={{ __html: parseMD(block.text) }} />;
            case 'code':
              return (
                <pre key={i} className="slide-code-block">
                  <SyntaxHighlighter code={block.code} language={block.language || 'css'} />
                </pre>
              );
            case 'list':
              return (
                <ul key={i} className="slide-list">
                  {block.items.map((item, j) => <li key={j} dangerouslySetInnerHTML={{ __html: parseMD(item) }} />)}
                </ul>
              );
            case 'heading':
              return <h3 key={i} className="slide-heading cyan-text" dangerouslySetInnerHTML={{ __html: parseMD(block.text) }} />;
            case 'image':
              return (
                <div key={i} className="slide-image-wrapper">
                  <img src={block.url} alt={block.alt} className="slide-image" />
                  {block.caption && <p className="slide-image-caption" dangerouslySetInnerHTML={{ __html: parseMD(block.caption) }} />}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

TabsBlock.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.object).isRequired,
};

