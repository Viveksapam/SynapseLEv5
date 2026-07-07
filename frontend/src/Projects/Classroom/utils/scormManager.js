import pipwerks from 'pipwerks-scorm-api-wrapper';

let _isScormActive = false;
const LOCAL_STORAGE_KEY = 'sle_dev_suspend_data';
const LOCAL_COMPLETION_KEY = 'sle_dev_completion';

export const scormManager = {
  initialize: () => {
    _isScormActive = pipwerks.SCORM.init();
    if (!_isScormActive) {
      // Dev mode: fallback to localStorage when no LMS present
    }
    return true; // We always return true now since we have a fallback
  },

  getSuspendData: () => {
    if (_isScormActive) {
      return pipwerks.SCORM.get('cmi.suspend_data');
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  },

  setSuspendData: (data) => {
    const stringifiedData = JSON.stringify(data);
    if (_isScormActive) {
      const success = pipwerks.SCORM.set('cmi.suspend_data', stringifiedData);
      if (success) pipwerks.SCORM.save();
      return success;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, stringifiedData);
    return true;
  },

  setCompletionStatus: (status) => {
    if (_isScormActive) {
      const success = pipwerks.SCORM.set('cmi.core.lesson_status', status);
      if (success) pipwerks.SCORM.save();
      return success;
    }
    localStorage.setItem(LOCAL_COMPLETION_KEY, status);
    return true;
  },

  setScore: (score, max = 100, min = 0) => {
    if (_isScormActive) {
      pipwerks.SCORM.set('cmi.core.score.raw', score);
      pipwerks.SCORM.set('cmi.core.score.max', max);
      pipwerks.SCORM.set('cmi.core.score.min', min);
      pipwerks.SCORM.save();
      return true;
    }
    return true;
  },

  terminate: () => {
    if (_isScormActive) {
      const success = pipwerks.SCORM.quit();
      return success;
    }
    return true;
  }
};

