import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { DynamicSlideRenderer } from './DynamicSlideRenderer';
import { SelectionHighlighter } from './SelectionHighlighter';
import './Layout.css';
import { useCourse } from '../hooks/useCourse';

export function Layout({ children }) {
  const { state, dispatch } = useCourse();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useNavigate();
  const handleNext = () => dispatch({ type: 'GO_NEXT' });
  const handlePrev = () => dispatch({ type: 'GO_PREV' });
  const handleJump = (index) => dispatch({ type: 'GO_TO_SLIDE', payload: index });

  const totalSlides = state.courseData?.length || 0;
  const currentSlide = state.currentSlideIndex + 1;
  const progressPercent = totalSlides ? (currentSlide / totalSlides) * 100 : 0;

  return (
    <div className={`layout-container ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <SelectionHighlighter />
      <aside className="layout-sidebar">
        <div className="sidebar-header">COURSE_MODULES</div>
        <ul className="sidebar-list">
          {state.courseData?.map((slide, index) => (
            <li 
              key={slide.id || index}
              className={`sidebar-item ${index === state.currentSlideIndex ? 'active' : ''}`}
              onClick={() => handleJump(index)}
            >
              <span className="sidebar-item-number">{index + 1}.</span>
              <span className="sidebar-item-title">{slide.title || `Slide ${index + 1}`}</span>
            </li>
          ))}
        </ul>
      </aside>

      <header className="layout-header">
        <div className="header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="sidebar-toggle-btn"
              title="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="layout-title">SYS_E_LEARN // CSS_MASTERY</div>
            <button 
              onClick={() => navigate('/')} 
              className="main-page-btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color, #333)',
                color: 'var(--text-color, #fff)',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                marginLeft: '1rem'
              }}
            >
              Main Page
            </button>
          </div>
          <div className="layout-progress-text">
            [ {currentSlide} / {totalSlides} ]
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </header>

      <main className="layout-content">
        <div className="content-inner">
          {children}
        </div>
      </main>

      <footer className="layout-footer">
        <button 
          className="nav-btn prev-btn"
          onClick={handlePrev} 
          disabled={state.currentSlideIndex === 0}
        >
          &lt; PREV_SEQ
        </button>
        <button 
          className="nav-btn next-btn"
          onClick={handleNext} 
          disabled={state.currentSlideIndex === totalSlides - 1}
        >
          NEXT_SEQ &gt;
        </button>
      </footer>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};

