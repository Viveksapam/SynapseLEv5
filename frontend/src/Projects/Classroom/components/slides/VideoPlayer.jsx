import React from 'react';
import PropTypes from 'prop-types';
import './VideoPlayer.css';

export function VideoPlayer({ data }) {
  return (
    <div className="video-wrapper">
      <h2 className="slide-title cyan-text" style={{ padding: '0 1rem 1rem 1rem' }}>{data.title}</h2>
      {data.videoId ? (
        <iframe
          className="video-element"
          src={`https://www.youtube.com/embed/${data.videoId}`}
          title={data.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <video 
          className="video-element" 
          controls 
          src={data.videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

VideoPlayer.propTypes = {
  data: PropTypes.object.isRequired,
};

