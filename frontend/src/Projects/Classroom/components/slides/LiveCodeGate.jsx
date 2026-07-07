import React from 'react';
import PropTypes from 'prop-types';

const LiveCodeGate = ({ strTitle, boolHasLimit, numMaxAttempts, numAttemptsUsed, boolLockedOut, strCooldownText, onStart }) => (
  <div className="slide-container">
    <h2 className="slide-title quiz-gate-title">{strTitle}</h2>
    <div className="quiz-gate">
      <div className="quiz-gate-icon">💻</div>
      <p className="quiz-gate-text">
        This is a graded interactive coding challenge. You will need to write CSS to pass the validations.
      </p>

      {boolHasLimit && (
        <div className="quiz-gate-limit">
          <span className="limit-label">Attempt Limit:</span>
          <span className="limit-value">{numMaxAttempts} attempts per 8 hours</span>
        </div>
      )}

      {boolHasLimit && numAttemptsUsed > 0 && (
        <div className="quiz-gate-used">
          Attempts used: {numAttemptsUsed} / {numMaxAttempts}
        </div>
      )}

      {boolLockedOut ? (
        <div className="quiz-lockout">
          <span className="lockout-icon">🔒</span>
          <p>You&apos;ve used all {numMaxAttempts} attempts.</p>
          <p className="lockout-timer">Resets in: {strCooldownText}</p>
        </div>
      ) : (
        <button className="nav-btn quiz-start-btn" onClick={onStart}>
          START CHALLENGE
        </button>
      )}
    </div>
  </div>
);

LiveCodeGate.propTypes = {
  strTitle: PropTypes.string.isRequired,
  boolHasLimit: PropTypes.bool.isRequired,
  numMaxAttempts: PropTypes.number,
  numAttemptsUsed: PropTypes.number.isRequired,
  boolLockedOut: PropTypes.bool.isRequired,
  strCooldownText: PropTypes.string,
  onStart: PropTypes.func.isRequired,
};

export default LiveCodeGate;
