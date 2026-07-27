import React from 'react';
import PropTypes from 'prop-types';

const WelcomeOverlay = ({ boolShowWelcomeState, boolIsWelcomeFadingState, numWelcomeProgressState }) => {
  if (!boolShowWelcomeState) return null;

  return (
    <div className={`ath-welcome-overlay ${boolIsWelcomeFadingState ? 'fade-out' : ''}`}>
      <div className="ath-welcome-content">
        <span className="ath-welcome-system">SYSTEM INITIALIZATION // BOOT_CORE</span>
        <h1 className="ath-welcome-title">SYNAPSE LE</h1>
        
        <div className="ath-welcome-loader-box">
          <div className="ath-welcome-progress-bar">
            <div
              className="ath-welcome-progress-fill"
              style={{ width: `${numWelcomeProgressState}%` }}
            />
          </div>
          <span className="ath-welcome-percentage">
            {numWelcomeProgressState.toString().padStart(3, '0')} // 100
          </span>
        </div>

        <div className="ath-welcome-footer">
          <span>ESTABLISHED v4.02</span>
          <span>TECHNICAL RIGOR & ETHICS.</span>
        </div>
      </div>
    </div>
  );
};

WelcomeOverlay.propTypes = {
  boolShowWelcomeState: PropTypes.bool.isRequired,
  boolIsWelcomeFadingState: PropTypes.bool.isRequired,
  numWelcomeProgressState: PropTypes.number.isRequired
};

export default WelcomeOverlay;
