import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../../../utils/sanitize';
import './SyntaxHighlighter.css';

export function SyntaxHighlighter({ code, language = 'css' }) {
  if (language !== 'css') {
    return <code className="syntax-base">{code}</code>;
  }

  // Very basic CSS syntax highlighting using regex
  const highlightCSS = (cssString) => {
    // Escape HTML first to prevent XSS and malformed tags
    let escaped = cssString.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 1. Comments
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
    
    // 2. Properties: anything before a colon that isn't inside a comment or string
    // This is tricky with simple regex, but usually safe for simple code snippets:
    // Matches word followed by colon
    escaped = escaped.replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="token-property">$1</span>');
    
    // 3. Selectors (pseudo-classes, classes, ids)
    // Matches .class, #id, :pseudo before a brace
    escaped = escaped.replace(/([.#:][a-zA-Z0-9_-]+)/g, '<span class="token-selector">$1</span>');

    // 4. Values (numbers with units, hex codes)
    escaped = escaped.replace(/(\b\d+(?:px|em|rem|vh|vw|%|s|ms)\b)/g, '<span class="token-value">$1</span>');
    escaped = escaped.replace(/(#[0-9a-fA-F]{3,8}\b)/g, '<span class="token-value">$1</span>');

    // 5. Punctuation
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

