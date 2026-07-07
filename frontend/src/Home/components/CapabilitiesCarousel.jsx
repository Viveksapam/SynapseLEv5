import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML } from '../../utils/sanitize';

const CapabilitiesCarousel = ({ boolAnimationsReadyState, arrSkillsState, onSelectSkill }) => {
  return (
    <section className={`ath-carousel-section ath-reveal ${boolAnimationsReadyState ? 'ath-fade-in-up ath-carousel-delay' : 'ath-pre-animate'}`}>
      <div className="ath-carousel-fade-l"></div>
      <div className="ath-carousel-fade-r"></div>
      
      <div className="ath-carousel-scroll">
        {arrSkillsState.length === 0 ? (
          [...Array(12)].map((_, i) => (
            <div key={i} className="ath-carousel-item">
              <span className="material-symbols-outlined text-primary">sync</span>
              <span className="ath-carousel-item-title">Loading Capabilities...</span>
            </div>
          ))
        ) : (
          // Duplicate skills array to ensure seamless infinite scroll loop
          Array(4).fill(arrSkillsState).flat().map((skill, index) => (
            <div 
              key={`${skill.id || 'skill'}-${index}`} 
              className="ath-carousel-item" 
              onClick={() => onSelectSkill(skill)}
              style={{ cursor: 'pointer' }}
            >
              {skill.strIconSvg ? (
                <div 
                  className="ath-carousel-item-icon" 
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(skill.strIconSvg) }}
                />
              ) : (
                <span className="material-symbols-outlined text-primary">analytics</span>
              )}
              <span className="ath-carousel-item-title">{skill.strTitle}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

CapabilitiesCarousel.propTypes = {
  boolAnimationsReadyState: PropTypes.bool.isRequired,
  arrSkillsState: PropTypes.array.isRequired,
  onSelectSkill: PropTypes.func.isRequired
};

export default CapabilitiesCarousel;
