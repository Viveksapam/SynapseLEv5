import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCourse } from '../../hooks/useCourse';
import { getAttemptData, saveAttemptData, getTimeRemaining } from '../../utils/attemptTracker';
import QuizEngineGate from './QuizEngineGate';
import './QuizEngine.css';

const ATTEMPT_STORAGE_KEY = 'sle_quiz_attempts';
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

export const QuizEngine = ({ data }) => {
  const { state, dispatch } = useCourse();
  const savedAnswer = state.userAnswers[data.id];

  const [boolHasStartedState, setBoolHasStartedState] = useState(savedAnswer !== undefined);
  const [numSelectedIdxState, setNumSelectedIdxState] = useState(savedAnswer !== undefined ? savedAnswer : null);
  const [boolShowFeedbackState, setBoolShowFeedbackState] = useState(savedAnswer !== undefined);
  const [objAttemptInfoState, setObjAttemptInfoState] = useState(getAttemptData(ATTEMPT_STORAGE_KEY, data.id));
  const [strCooldownTextState, setStrCooldownTextState] = useState(null);

  const numMaxAttempts = data.maxAttempts || null;
  const boolHasLimit = numMaxAttempts !== null;

  useEffect(() => {
    if (!boolHasLimit) return;
    const check = () => {
      const objInfo = getAttemptData(ATTEMPT_STORAGE_KEY, data.id);
      if (objInfo.count < numMaxAttempts || !objInfo.firstAttemptTime) { setStrCooldownTextState(null); return; }
      const strRemaining = getTimeRemaining(objInfo.firstAttemptTime, COOLDOWN_MS);
      if (strRemaining) { setStrCooldownTextState(strRemaining); return; }
      const objReset = { count: 0, firstAttemptTime: null };
      saveAttemptData(ATTEMPT_STORAGE_KEY, data.id, objReset);
      setObjAttemptInfoState(objReset);
      setStrCooldownTextState(null);
      setBoolHasStartedState(false);
      setNumSelectedIdxState(null);
      setBoolShowFeedbackState(false);
    };
    check();
    const intervalId = setInterval(check, 60000);
    return () => clearInterval(intervalId);
  }, [data.id, boolHasLimit, numMaxAttempts]);

  const handleSubmit = () => {
    if (numSelectedIdxState === null) return;
    dispatch({ type: 'SAVE_ANSWER', payload: { slideId: data.id, answer: numSelectedIdxState } });
    setBoolShowFeedbackState(true);

    if (boolHasLimit) {
      const objCurrent = getAttemptData(ATTEMPT_STORAGE_KEY, data.id);
      const objUpdated = {
        count: objCurrent.count + 1,
        firstAttemptTime: objCurrent.firstAttemptTime || Date.now(),
      };
      saveAttemptData(ATTEMPT_STORAGE_KEY, data.id, objUpdated);
      setObjAttemptInfoState(objUpdated);
    }
  };

  const boolIsCorrect = numSelectedIdxState === data.correctAnswer;
  const numAttemptsUsed = objAttemptInfoState.count;
  const boolLockedOut = boolHasLimit && numAttemptsUsed >= numMaxAttempts && !!strCooldownTextState;

  if (!boolHasStartedState) {
    return (
      <QuizEngineGate
        strTitle={data.title}
        boolHasLimit={boolHasLimit}
        numMaxAttempts={numMaxAttempts}
        numAttemptsUsed={numAttemptsUsed}
        boolLockedOut={boolLockedOut}
        strCooldownText={strCooldownTextState}
        onStart={() => setBoolHasStartedState(true)}
      />
    );
  }

  return (
    <div className="quiz-container">
      <h2 className="slide-title quiz-active-title">{data.title}</h2>

      {boolHasLimit && (
        <div className="quiz-attempt-badge">
          Attempt {Math.min(numAttemptsUsed + (boolShowFeedbackState ? 0 : 1), numMaxAttempts)} of {numMaxAttempts}
        </div>
      )}

      <div className="quiz-question">{data.question}</div>

      <div className="quiz-options">
        {data.options.map((strOpt, numIdx) => (
          <button
            key={numIdx}
            className={`quiz-option ${numSelectedIdxState === numIdx ? 'selected' : ''}`}
            onClick={() => !boolShowFeedbackState && setNumSelectedIdxState(numIdx)}
            disabled={boolShowFeedbackState}
          >
            [{numIdx + 1}] {strOpt}
          </button>
        ))}
      </div>

      {!boolShowFeedbackState && (
        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button className="nav-btn" onClick={handleSubmit} disabled={numSelectedIdxState === null}>
            SUBMIT_ANSWER
          </button>
        </div>
      )}

      {boolShowFeedbackState && (
        <div className={`quiz-feedback ${boolIsCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
          {boolIsCorrect ? '✓ Correct!' : '✗ Incorrect.'}
        </div>
      )}
    </div>
  );
};

QuizEngine.propTypes = {
  data: PropTypes.object.isRequired,
};
