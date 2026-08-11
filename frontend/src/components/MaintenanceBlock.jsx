import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const MaintenanceBlock = ({ pageName }) => {
  useEffect(() => {
    console.log(`[MAINTENANCE] ${pageName} is under maintenance`);
  }, [pageName]);

  return (
    <div className="ath-maintenance-wrapper">
      <div className="ath-maintenance-container">
        <div className="ath-maintenance-content">
          <h1 className="ath-maintenance-title">Under Maintenance</h1>
          <p className="ath-maintenance-message">
            {pageName} is temporarily unavailable while we make improvements.
          </p>
          <p className="ath-maintenance-subtitle">
            We'll be back soon. In the meantime, explore other sections of Synapse LE.
          </p>
          <Link to="/" className="ath-maintenance-btn">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

MaintenanceBlock.propTypes = {
  pageName: PropTypes.string.isRequired
};

export default MaintenanceBlock;
