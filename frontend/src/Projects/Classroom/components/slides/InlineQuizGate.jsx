import React from 'react';
import PropTypes from 'prop-types';

export const InlineQuizGate = ({ numQuestionsCount, onStart }) => (
  <div className="quiz-gate-container">
    <div className="quiz-gate-card">
      <div className="quiz-gate-portal">
        <div className="portal-ring" />
        <div className="portal-core"><span className="portal-lock-icon">🔒</span></div>
      </div>
      <div className="quiz-gate-badge">GATED ASSESSMENT</div>
      <h3 className="quiz-gate-heading">Summative Assessment</h3>
      <p className="quiz-gate-description">
        This module quiz validates your comprehension of basic CSS Syntax, the Cascade, Specificity, and modern visual selectors.
      </p>
      <div className="quiz-gate-details">
        <div className="detail-item"><span className="detail-icon">📝</span><span className="detail-text">{numQuestionsCount} Questions</span></div>
        <div className="detail-item"><span className="detail-icon">⏱️</span><span className="detail-text">No time limit</span></div>
        <div className="detail-item"><span className="detail-icon">🔑</span><span className="detail-text">Pass required to unlock Key</span></div>
      </div>
      <button className="quiz-gate-start-btn" onClick={onStart}>START ASSESSMENT</button>
    </div>
  </div>
);

InlineQuizGate.propTypes = {
  numQuestionsCount: PropTypes.number.isRequired,
  onStart: PropTypes.func.isRequired,
};

export const InlineQuizResult = ({ arrQuestions, objAnswers, onReset }) => (
  <div className="quiz-gate-container">
    <div className="quiz-gate-card completed">
      <div className="quiz-gate-portal completed">
        <div className="portal-ring completed" />
        <div className="portal-core completed"><span className="portal-lock-icon">🔓</span></div>
      </div>
      <div className="quiz-gate-success-badge">PASSED</div>
      <h3 className="quiz-gate-heading">Assessment Completed!</h3>
      <p className="quiz-gate-description">
        You have successfully completed the summative assessment. You can now reveal the answer key below to review and verify your responses.
      </p>
      <div className="quiz-summary-answers">
        <h4>Your Response Summary:</h4>
        <ul className="response-summary-list">
          {arrQuestions.map((q, numIdx) => {
            const strAns = objAnswers[`q-${numIdx}`];
            const strDisplay = strAns ? (strAns.length > 40 ? strAns.substring(0, 40) + '...' : strAns) : null;
            return (
              <li key={numIdx} className="response-summary-item">
                <span className="summary-q-num">Q{numIdx + 1}:</span>
                <span className="summary-q-ans">{strDisplay || <em>Skipped</em>}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <button className="quiz-gate-reset-btn" onClick={onReset}>RE-TAKE ASSESSMENT</button>
    </div>
  </div>
);

InlineQuizResult.propTypes = {
  arrQuestions: PropTypes.array.isRequired,
  objAnswers: PropTypes.object.isRequired,
  onReset: PropTypes.func.isRequired,
};
