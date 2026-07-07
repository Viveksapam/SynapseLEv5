import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

// Renders user-authored markdown. Every dangerouslySetInnerHTML in this
// codebase must pass through DOMPurify (project security standard).
const MarkdownContent = ({ content, style }) => {
  const strHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(content || ''), { USE_PROFILES: { html: true } }),
    [content],
  );
  return (
    <div
      className="verisphere-markdown"
      style={{ lineHeight: 1.6, wordBreak: 'break-word', ...style }}
      dangerouslySetInnerHTML={{ __html: strHtml }}
    />
  );
};

MarkdownContent.propTypes = {
  content: PropTypes.string,
  style: PropTypes.object,
};

export default MarkdownContent;
