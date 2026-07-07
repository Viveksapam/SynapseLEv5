import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InlineQuizGate, InlineQuizResult } from './InlineQuizGate';
import './InlineQuiz.css';

export const InlineQuiz = ({ block }) => {
  const [objAnswersState, setObjAnswersState] = useState({});
  const [boolStartedState, setBoolStartedState] = useState(false);
  const [numActiveIndexState, setNumActiveIndexState] = useState(0);
  const [boolSubmittedState, setBoolSubmittedState] = useState(false);

  const numQuestionsCount = block.questions?.length || 0;
  const strAnswerKey = `q-${numActiveIndexState}`;

  const handleInput = (strKey, strValue) => setObjAnswersState((prev) => ({ ...prev, [strKey]: strValue }));
  const handleNext = () => numActiveIndexState < numQuestionsCount - 1 && setNumActiveIndexState((p) => p + 1);
  const handlePrev = () => numActiveIndexState > 0 && setNumActiveIndexState((p) => p - 1);
  const handleReset = () => {
    setObjAnswersState({}); setNumActiveIndexState(0);
    setBoolSubmittedState(false); setBoolStartedState(false);
  };

  if (!boolStartedState) {
    return <InlineQuizGate numQuestionsCount={numQuestionsCount} onStart={() => setBoolStartedState(true)} />;
  }

  if (boolSubmittedState) {
    return <InlineQuizResult arrQuestions={block.questions} objAnswers={objAnswersState} onReset={handleReset} />;
  }

  const objQ = block.questions[numActiveIndexState];
  const numProgress = ((numActiveIndexState + 1) / numQuestionsCount) * 100;
  const strCurrent = objAnswersState[strAnswerKey] || '';

  return (
    <div className="quiz-wizard-container">
      <div className="quiz-wizard-header">
        <div className="progress-label">Question <span>{numActiveIndexState + 1}</span> of {numQuestionsCount}</div>
        <div className="quiz-wizard-progress-bar">
          <div className="quiz-wizard-progress-fill" style={{ width: `${numProgress}%` }} />
        </div>
      </div>

      <div className="quiz-wizard-card">
        <p className="inline-quiz-prompt"><strong>Prompt:</strong> {objQ.prompt}</p>

        {objQ.type === 'mcq' && (
          <div className="inline-quiz-options">
            {objQ.options.map((strOpt, numOIdx) => (
              <label key={numOIdx} className={`inline-quiz-label ${strCurrent === strOpt ? 'selected' : ''}`}>
                <input
                  type="radio" name={strAnswerKey} value={strOpt}
                  checked={strCurrent === strOpt}
                  onChange={(e) => handleInput(strAnswerKey, e.target.value)}
                />
                <span>{strOpt}</span>
              </label>
            ))}
          </div>
        )}

        {objQ.type === 'fill_in_blank' && (
          <div className="inline-quiz-fill">
            <input
              type="text" className="inline-quiz-text-input" placeholder="Type your answer here..."
              value={strCurrent} onChange={(e) => handleInput(strAnswerKey, e.target.value)}
            />
          </div>
        )}

        {(objQ.type === 'short_answer' || objQ.type === 'open_ended') && (
          <div className="inline-quiz-textarea">
            <textarea
              rows={4} className="inline-quiz-text-input" placeholder="Write your answer..."
              value={strCurrent} onChange={(e) => handleInput(strAnswerKey, e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="quiz-wizard-footer">
        <button className="quiz-wizard-nav-btn prev" onClick={handlePrev} disabled={numActiveIndexState === 0}>
          &larr; BACK
        </button>
        {numActiveIndexState === numQuestionsCount - 1 ? (
          <button className="quiz-wizard-nav-btn submit" onClick={() => setBoolSubmittedState(true)}>
            FINISH & SUBMIT
          </button>
        ) : (
          <button className="quiz-wizard-nav-btn next" onClick={handleNext}>NEXT &rarr;</button>
        )}
      </div>
    </div>
  );
};

InlineQuiz.propTypes = {
  block: PropTypes.object.isRequired,
};
