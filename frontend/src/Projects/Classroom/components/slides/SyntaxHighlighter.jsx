import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../../../utils/sanitize';
import './SyntaxHighlighter.css';

export function SyntaxHighlighter({ code, language = 'css' }) {
  if (language !== 'css') {
    return <code className="syntax-base">{code}</code>;
  }

  
  const highlightCSS = (cssString) => {
    
    let escaped = cssString.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
    
    
    
    
    escaped = escaped.replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="token-property">$1</span>');
    
    
    
    escaped = escaped.replace(/([.#:][a-zA-Z0-9_-]+)/g, '<span class="token-selector">$1</span>');

    
    escaped = escaped.replace(/(\b\d+(?:px|em|rem|vh|vw|%|s|ms)\b)/g, '<span class="token-value">$1</span>');
    escaped = escaped.replace(/(#[0-9a-fA-F]{3,8}\b)/g, '<span class="token-value">$1</span>');

    
    escaped = escaped.replace(/([{}:;])/g, '<span class="token-punctuation">$1</span>');

    return escaped;
  };

  return (
    <code 
      className="syntax-base"
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(highlightCSS(code)) }}
    />
  );
}

SyntaxHighlighter.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string,
};

