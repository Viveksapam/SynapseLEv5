import React from 'react';
import SLEAppContent from './App';
import './styles/global.css';
import { CourseProvider } from './context/CourseContext';

export default function SLEApp() {
  return (
    <CourseProvider>
      <SLEAppContent />
    </CourseProvider>
  );
}

