import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Code, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import './AssessmentHub.css';

function AssessmentHub() {
  const navigate = useNavigate();
  const [numTimeLeftState, setNumTimeLeftState] = useState(1800); // 30 minutes
  const [numCurrentQuestionState, setNumCurrentQuestionState] = useState(1);
  const [strSelectedAnsState, setStrSelectedAnsState] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNumTimeLeftState((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectAnswer = (strAns) => {
    setStrSelectedAnsState(strAns);
  };

  const handleSubmit = () => {
    // Mock submit logic
    navigate('/credentials', { state: { boolJustCompleted: true } });
  };

  return (
    <div className="assessment-hub-wrapper">
      <SEO 
        title="Skill Assessments - Synapse" 
        description="Test your software engineering knowledge. Pass our advanced skill assessments to earn verified credentials on Synapse."
      />
      <header className="assessment-header">
        <button className="btn-exit" onClick={() => navigate('/credentials')}>
          <ArrowLeft size={18} /> Exit Exam
        </button>
        <div className="exam-timer">
          <Clock size={18} />
          <span className={`time-text ${numTimeLeftState < 300 ? 'danger' : ''}`}>
            {formatTime(numTimeLeftState)}
          </span>
        </div>
      </header>

      <main className="assessment-main">
        <div className="question-panel">
          <div className="question-meta">
            <span className="question-number">Question {numCurrentQuestionState} of 5</span>
            <span className="question-category">Software Architecture</span>
          </div>
          <h2 className="question-text">
            Which FastAPI class is preferred in the Synapse workspace to build clear, RESTful API endpoints?
          </h2>
          <div className="question-alert">
            <AlertTriangle size={16} /> Select the most optimal approach based on maintainability.
          </div>
          <div className="options-list">
            {[
              ['A', 'Function-Based Views (FBVs)'], 
              ['B', 'Class-Based Views (CBVs)'], 
              ['C', 'Direct HTML templates']
            ].map(([val, label]) => (
              <button 
                key={val} 
                className={`option-btn ${strSelectedAnsState === val ? 'selected' : ''}`} 
                onClick={() => handleSelectAnswer(val)}
              >
                <div className="option-letter">{val}</div>
                <div className="option-label">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="code-panel">
          <div className="code-header">
            <Code size={16} /> Workspace Context
          </div>
          <div className="code-editor-mock">
            <pre><code>
{`# views.py
from rest_framework.views import APIView
from rest_framework.response import Response

class ProductListView(APIView):
    def get(self, request):
        # Implementation here
        pass`}
            </code></pre>
          </div>
          <div className="action-bar">
            <button 
              className="btn-submit-exam" 
              disabled={!strSelectedAnsState}
              onClick={handleSubmit}
            >
              Submit Answer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AssessmentHub;

