import React from 'react';
import PropTypes from 'prop-types';
import { normalizeEmbedUrl, isImageUrl } from '../utils/embedUtils';

const MediaEmbed = ({ strMediaUrl, numMaxImageHeight = 315, numIframeHeight = 350, numInstagramHeight = 550, numInstagramMaxWidth = 380 }) => {
  if (!strMediaUrl || strMediaUrl.trim() === '') return null;
  const boolIsInstagram = strMediaUrl.includes('instagram.com');

  return (
    <div className="verisphere-media-container mb-2" style={{
      marginTop: '1rem', overflow: 'hidden', borderRadius: 'var(--cr-radius-input)', border: '1px solid var(--cr-border)',
    }}>
      {isImageUrl(strMediaUrl) ? (
        <img
          src={strMediaUrl}
          alt="Post media"
          style={{ width: '100%', maxHeight: `${numMaxImageHeight}px`, objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
        />
      ) : (
        <iframe
          width="100%"
          src={normalizeEmbedUrl(strMediaUrl)}
          title="Media player"
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            display: 'block', overflow: 'hidden',
            ...(boolIsInstagram
              ? { maxWidth: `${numInstagramMaxWidth}px`, margin: '0 auto', height: `${numInstagramHeight}px` }
              : { height: `${numIframeHeight}px` }),
          }}
        />
      )}
    </div>
  );
};

MediaEmbed.propTypes = {
  strMediaUrl: PropTypes.string,
  numMaxImageHeight: PropTypes.number,
  numIframeHeight: PropTypes.number,
  numInstagramHeight: PropTypes.number,
  numInstagramMaxWidth: PropTypes.number,
};

export default MediaEmbed;
