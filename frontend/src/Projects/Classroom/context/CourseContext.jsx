import React, { createContext, useReducer, useEffect } from 'react';
import { scormManager } from '../utils/scormManager';

export const CourseContext = createContext(null);

const initialState = {
  currentSlideIndex: 0,
  progress: 0,
  userAnswers: {},
  courseData: [],
  isScormInitialized: false,
};

function courseReducer(state, action) {
  switch (action.type) {
    case 'INIT_COURSE':
      return {
        ...state,
        courseData: action.payload.courseData,
        currentSlideIndex: action.payload.savedState?.currentSlideIndex || 0,
        userAnswers: action.payload.savedState?.userAnswers || {},
        isScormInitialized: action.payload.isScormInitialized,
      };
    case 'GO_NEXT':
      if (state.currentSlideIndex < state.courseData.length - 1) {
        return { ...state, currentSlideIndex: state.currentSlideIndex + 1 };
      }
      return state;
    case 'GO_PREV':
      if (state.currentSlideIndex > 0) {
        return { ...state, currentSlideIndex: state.currentSlideIndex - 1 };
      }
      return state;
    case 'GO_TO_SLIDE':
      if (action.payload >= 0 && action.payload < state.courseData.length) {
        return { ...state, currentSlideIndex: action.payload };
      }
      return state;
    case 'SAVE_ANSWER':
      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.slideId]: action.payload.answer,
        },
      };
    case 'COMPLETE_COURSE':
      return { ...state, progress: 100 };
    default:
      return state;
  }
}

export function CourseProvider({ children }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  // Initialize SCORM and load course data
  useEffect(() => {
    const init = async () => {
      const isScormInitialized = scormManager.initialize();
      
      // Fetch course data
      const response = await fetch('/courseData.json');
      const courseData = await response.json();

      let savedState = null;
      if (isScormInitialized) {
        const suspendData = scormManager.getSuspendData();
        if (suspendData) {
          try {
            savedState = JSON.parse(suspendData);
          } catch (e) {
            console.error('Failed to parse suspend data');
          }
        }
      }

      dispatch({ type: 'INIT_COURSE', payload: { courseData, savedState, isScormInitialized } });
    };

    init();

    return () => {
      scormManager.terminate();
    };
  }, []);

  // Save to SCORM when state changes
  useEffect(() => {
    if (state.isScormInitialized && state.courseData.length > 0) {
      const dataToSave = {
        currentSlideIndex: state.currentSlideIndex,
        userAnswers: state.userAnswers,
      };
      scormManager.setSuspendData(dataToSave);

      // Check completion
      if (state.currentSlideIndex === state.courseData.length - 1) {
        scormManager.setCompletionStatus('completed');
        
        // Calculate score
        let totalTasks = 0;
        let correctTasks = 0;
        
        state.courseData.forEach(slide => {
          if (slide.type === 'quiz') {
            totalTasks++;
            if (state.userAnswers[slide.id] === slide.correctAnswer) {
              correctTasks++;
            }
          } else if (slide.type === 'interactive' && slide.validations && slide.validations.length > 0) {
            totalTasks++;
            if (state.userAnswers[slide.id] === true) {
              correctTasks++;
            }
          }
        });

        if (totalTasks > 0) {
          const score = Math.round((correctTasks / totalTasks) * 100);
          scormManager.setScore(score);
        }
      } else {
        scormManager.setCompletionStatus('incomplete');
      }
    }
  }, [state.currentSlideIndex, state.userAnswers, state.isScormInitialized, state.courseData]);

  return (
    <CourseContext.Provider value={{ state, dispatch }}>
      {children}
    </CourseContext.Provider>
  );
}

