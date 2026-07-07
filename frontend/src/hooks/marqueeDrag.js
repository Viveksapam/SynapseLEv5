export const attachDesktopDrag = (objContainer, refIsInteracting) => {
  let boolIsDragging = false;
  let numStartX = 0;
  let numScrollLeft = 0;

  const onMouseDown = (e) => {
    boolIsDragging = true;
    refIsInteracting.current = true;
    numStartX = e.pageX - objContainer.offsetLeft;
    numScrollLeft = objContainer.scrollLeft;
    objContainer.style.cursor = 'grabbing';
    objContainer.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!boolIsDragging) return;
    e.preventDefault();
    const numX = e.pageX - objContainer.offsetLeft;
    const numWalk = (numX - numStartX) * 2;
    objContainer.scrollLeft = numScrollLeft - numWalk;
  };

  const onMouseUpOrLeave = () => {
    boolIsDragging = false;
    refIsInteracting.current = false;
    objContainer.style.cursor = 'grab';
    objContainer.style.userSelect = '';
  };

  objContainer.style.cursor = 'grab';
  objContainer.addEventListener('mousedown', onMouseDown);
  objContainer.addEventListener('mousemove', onMouseMove);
  objContainer.addEventListener('mouseup', onMouseUpOrLeave);
  objContainer.addEventListener('mouseleave', onMouseUpOrLeave);

  return () => {
    objContainer.removeEventListener('mousedown', onMouseDown);
    objContainer.removeEventListener('mousemove', onMouseMove);
    objContainer.removeEventListener('mouseup', onMouseUpOrLeave);
    objContainer.removeEventListener('mouseleave', onMouseUpOrLeave);
  };
};

export const attachTouchTracking = (objContainer, refIsInteracting) => {
  const onStart = () => { refIsInteracting.current = true; };
  const onEnd = () => { refIsInteracting.current = false; };
  objContainer.addEventListener('touchstart', onStart, { passive: true });
  objContainer.addEventListener('touchend', onEnd, { passive: true });
  objContainer.addEventListener('touchcancel', onEnd, { passive: true });
  return () => {
    objContainer.removeEventListener('touchstart', onStart);
    objContainer.removeEventListener('touchend', onEnd);
    objContainer.removeEventListener('touchcancel', onEnd);
  };
};

export const attachWheelTracking = (objContainer, refIsInteracting) => {
  let numWheelTimer;
  const onWheel = () => {
    refIsInteracting.current = true;
    clearTimeout(numWheelTimer);
    numWheelTimer = setTimeout(() => { refIsInteracting.current = false; }, 200);
  };
  objContainer.addEventListener('wheel', onWheel, { passive: true });
  return () => objContainer.removeEventListener('wheel', onWheel);
};
