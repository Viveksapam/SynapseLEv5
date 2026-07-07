import React, { useEffect } from 'react';
import { useCourse } from '../hooks/useCourse';
import { ContentSlide } from './slides/ContentSlide';
import { VideoPlayer } from './slides/VideoPlayer';
import { QuizEngine } from './slides/QuizEngine';
import { LiveCodeSlide } from './slides/LiveCodeSlide';
import { VisualizerSlide } from './slides/VisualizerSlide';

export function DynamicSlideRenderer() {
  const { state } = useCourse();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.currentSlideIndex]);

  if (!state.courseData || state.courseData.length === 0) {
    return <div className="hacker-text">INITIALIZING SYSTEM...</div>;
  }

  const currentSlideData = state.courseData[state.currentSlideIndex];

  if (!currentSlideData) {
    return <div className="hacker-text">ERROR: DATA_NOT_FOUND</div>;
  }

  switch (currentSlideData.type) {
    case 'content':
      return <ContentSlide data={currentSlideData} />;
    case 'video':
      return <VideoPlayer data={currentSlideData} />;
    case 'quiz':
      return <QuizEngine data={currentSlideData} />;
    case 'interactive':
      return <LiveCodeSlide data={currentSlideData} />;
    case 'visualizer':
      return <VisualizerSlide data={currentSlideData} />;
    default:
      return <div className="hacker-text">ERROR: UNKNOWN_MODULE_TYPE</div>;
  }
}

