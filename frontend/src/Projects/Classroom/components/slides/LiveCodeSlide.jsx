import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCourse } from '../../hooks/useCourse';
import { getAttemptData, saveAttemptData, getTimeRemaining } from '../../utils/attemptTracker';
import LiveCodeGate from './LiveCodeGate';
import LiveCodeWorkspace from './LiveCodeWorkspace';
import './LiveCodeSlide.css';

const ATTEMPT_STORAGE_KEY = 'sle_sandbox_attempts';
const COOLDOWN_MS = 8 * 60 * 60 * 1000;
const STR_PASS_MSG = 'TASK COMPLETED: Verification Passed.';

const validateCss = (arrValidations, strCss) => {
  for (const objV of arrValidations || []) {
    const objRegex = new RegExp(objV.regex, 'i');
    if (!objRegex.test(strCss)) return { boolPassed: false, strError: `ERROR: ${objV.errorMessage}` };
  }
  return { boolPassed: true, strError: '' };
};

export const LiveCodeSlide = ({ data }) => {
  const { state, dispatch } = useCourse();
  const objSavedStatus = state.userAnswers[data.id];
  const boolHasValidations = Array.isArray(data.validations) && data.validations.length > 0;
  const numMaxAttempts = data.maxAttempts || null;
  const boolHasLimit = boolHasValidations && numMaxAttempts !== null;

  const [boolHasStartedState, setBoolHasStartedState] = useState(!boolHasValidations || objSavedStatus === true);
  const [strCssCodeState, setStrCssCodeState] = useState(data.initialCss || '');
  const [strFeedbackState, setStrFeedbackState] = useState(objSavedStatus === true ? STR_PASS_MSG : '');
  const [boolIsSuccessState, setBoolIsSuccessState] = useState(objSavedStatus === true);
  const [objAttemptInfoState, setObjAttemptInfoState] = useState(getAttemptData(ATTEMPT_STORAGE_KEY, data.id));
  const [strCooldownTextState, setStrCooldownTextState] = useState(null);

  useEffect(() => {
    if (!boolHasLimit) return;

    const check = () => {
      const objInfo = getAttemptData(ATTEMPT_STORAGE_KEY, data.id);
      const boolMaxed = objInfo.count >= numMaxAttempts && objInfo.firstAttemptTime && !boolIsSuccessState;
      if (!boolMaxed) { setStrCooldownTextState(null); return; }
      const strRemaining = getTimeRemaining(objInfo.firstAttemptTime, COOLDOWN_MS);
      if (strRemaining) { setStrCooldownTextState(strRemaining); return; }
      const objReset = { count: 0, firstAttemptTime: null };
      saveAttemptData(ATTEMPT_STORAGE_KEY, data.id, objReset);
      setObjAttemptInfoState(objReset);
      setStrCooldownTextState(null);
      setBoolHasStartedState(false);
      setStrFeedbackState('');
    };

    check();
    const intervalId = setInterval(check, 60000);
    return () => clearInterval(intervalId);
  }, [data.id, boolHasLimit, numMaxAttempts, boolIsSuccessState]);

  const handleSubmit = () => {
    if (boolIsSuccessState) return;

    if (!boolHasValidations) {
      dispatch({ type: 'SAVE_ANSWER', payload: { slideId: data.id, answer: true } });
      setBoolIsSuccessState(true);
      setStrFeedbackState(STR_PASS_MSG);
      return;
    }

    const { boolPassed, strError } = validateCss(data.validations, strCssCodeState);
    setStrFeedbackState(boolPassed ? STR_PASS_MSG : strError);
    setBoolIsSuccessState(boolPassed);

    if (boolPassed) {
      dispatch({ type: 'SAVE_ANSWER', payload: { slideId: data.id, answer: true } });
      return;
    }

    if (boolHasLimit) {
      const objCurrent = getAttemptData(ATTEMPT_STORAGE_KEY, data.id);
      const objUpdated = {
        count: objCurrent.count + 1,
        firstAttemptTime: objCurrent.firstAttemptTime || Date.now(),
      };
      saveAttemptData(ATTEMPT_STORAGE_KEY, data.id, objUpdated);
      setObjAttemptInfoState(objUpdated);
      if (objUpdated.count >= numMaxAttempts) setBoolHasStartedState(false);
    }
  };

  const numAttemptsUsed = objAttemptInfoState.count;
  const boolLockedOut = boolHasLimit && numAttemptsUsed >= numMaxAttempts && !!strCooldownTextState && !boolIsSuccessState;

  if (!boolHasStartedState) {
    return (
      <LiveCodeGate
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
    <div className="live-code-container slide-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
        <h2 className="slide-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>{data.title}</h2>
        {boolHasLimit && !boolIsSuccessState && (
          <div className="quiz-attempt-badge" style={{ marginBottom: 0 }}>
            Attempt {numAttemptsUsed + 1} of {numMaxAttempts}
          </div>
        )}
      </div>

      <p className="slide-paragraph">{data.instruction}</p>

      <LiveCodeWorkspace
        strCssCode={strCssCodeState}
        onCssCodeChange={setStrCssCodeState}
        strHtmlContent={data.htmlContent}
        boolIsSuccess={boolIsSuccessState}
        onClearFeedback={() => { if (strFeedbackState && !boolIsSuccessState) setStrFeedbackState(''); }}
      />

      {boolHasValidations && (
        <div className="interactive-controls">
          <button className="nav-btn" onClick={handleSubmit} disabled={boolIsSuccessState} style={{ marginTop: '1rem' }}>
            {boolIsSuccessState ? 'VERIFIED' : 'RUN_VALIDATION'}
          </button>
          {strFeedbackState && (
            <div className={`validation-feedback ${boolIsSuccessState ? 'success-text' : 'error-text'}`} style={{ marginTop: '1rem', fontFamily: 'var(--sle-font-mono)' }}>
              {strFeedbackState}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

LiveCodeSlide.propTypes = {
  data: PropTypes.object.isRequired,
};
