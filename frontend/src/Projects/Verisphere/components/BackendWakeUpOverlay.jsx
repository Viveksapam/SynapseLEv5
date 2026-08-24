import React from 'react';
import PropTypes from 'prop-types';
import './BackendWakeUpOverlay.css';

// Presentational only - the parent decides where this renders (e.g. swapped in
// for routed content) based on the strStatus it gets from useBackendWakeUp.
const BackendWakeUpOverlay = ({ strStatus }) => {
  if (strStatus === 'checking' || strStatus === 'ready') return null;

  return (
    <div className="ath-wakeup-overlay" role="status" aria-live="polite">
      <div className="ath-wakeup-card">
        <div className="ath-wakeup-spinner" />
        {strStatus === 'waking' ? (
          <>
            <h2 className="ath-wakeup-title">Waking up the server</h2>
            <p className="ath-wakeup-message">
              This runs on a free backend that sleeps when idle. It's starting up now
              &mdash; this can take up to a minute.
            </p>
          </>
        ) : (
          <>
            <h2 className="ath-wakeup-title">Still starting up</h2>
            <p className="ath-wakeup-message">
              The server is taking longer than usual to wake up. Feel free to wait,
              or refresh the page in a bit.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

BackendWakeUpOverlay.propTypes = {
  strStatus: PropTypes.oneOf(['checking', 'waking', 'ready', 'unreachable']).isRequired,
};

export default BackendWakeUpOverlay;
