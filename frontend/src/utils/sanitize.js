import DOMPurify from 'dompurify';

export const sanitizeHTML = (strDirtyHtml) => {
  if (!strDirtyHtml) return '';
  return DOMPurify.sanitize(strDirtyHtml, {
    USE_PROFILES: { html: true, svg: true },
    ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'd', 'class'],
  });
};
