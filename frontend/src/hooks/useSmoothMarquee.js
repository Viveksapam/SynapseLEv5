import { useEffect, useRef } from 'react';
import { attachDesktopDrag, attachTouchTracking, attachWheelTracking } from './marqueeDrag';

export const useSmoothMarquee = (numSpeed = 0.5, numCopies = 4) => {
  const refContainer = useRef(null);
  const refLoopPoint = useRef(0);
  const refIsInteracting = useRef(false);
  const refAutoPos = useRef(0);

  useEffect(() => {
    const objContainer = refContainer.current;
    if (!objContainer) return;
    const objTrack = objContainer.firstElementChild;
    if (!objTrack) return;

    objTrack.style.willChange = 'transform';
    objTrack.style.backfaceVisibility = 'hidden';

    const calcLoopPoint = () => {
      const numWidth = objTrack.scrollWidth;
      if (numWidth <= 0) return;
      const numLoop = (numWidth + 24) / numCopies;
      if (Math.abs(numLoop - refLoopPoint.current) > 1) {
        refLoopPoint.current = numLoop;
        if (objContainer.scrollLeft < 10 && numLoop > 24) {
          objContainer.scrollLeft = numLoop;
          refAutoPos.current = numLoop;
        }
      }
    };

    const objObserver = new ResizeObserver(calcLoopPoint);
    objObserver.observe(objTrack);
    window.addEventListener('resize', calcLoopPoint);

    const cleanupTouch = attachTouchTracking(objContainer, refIsInteracting);
    const boolHasHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;
    const cleanupDrag = boolHasHover ? attachDesktopDrag(objContainer, refIsInteracting) : () => {};
    const cleanupWheel = attachWheelTracking(objContainer, refIsInteracting);

    const onScroll = () => {
      const numL = refLoopPoint.current;
      if (numL <= 24) return;
      if (objContainer.scrollLeft <= 0) {
        objContainer.scrollLeft = numL;
        refAutoPos.current = numL;
      } else if (objContainer.scrollLeft >= numL * 2) {
        const numNew = numL + (objContainer.scrollLeft - numL * 2);
        objContainer.scrollLeft = numNew;
        refAutoPos.current = numNew;
      }
    };
    objContainer.addEventListener('scroll', onScroll, { passive: true });

    let numFrameId;
    let boolTransformIsZero = false;

    const animate = () => {
      const numL = refLoopPoint.current;
      const numActualScroll = objContainer.scrollLeft;
      const numExpectedScroll = Math.floor(refAutoPos.current);
      const boolIsMomentum = Math.abs(numActualScroll - numExpectedScroll) > 1;

      if (refIsInteracting.current || boolIsMomentum) {
        refAutoPos.current = numActualScroll;
        if (!boolTransformIsZero) {
          objTrack.style.transform = 'translate3d(0, 0, 0)';
          boolTransformIsZero = true;
        }
      } else if (numL > 24) {
        boolTransformIsZero = false;
        refAutoPos.current += numSpeed;
        const numInt = Math.floor(refAutoPos.current);
        const numFrac = refAutoPos.current - numInt;
        if (numActualScroll !== numInt) objContainer.scrollLeft = numInt;
        objTrack.style.transform = `translate3d(${-numFrac}px, 0, 0)`;
      }
      numFrameId = requestAnimationFrame(animate);
    };

    refAutoPos.current = objContainer.scrollLeft;
    numFrameId = requestAnimationFrame(animate);

    return () => {
      objObserver.disconnect();
      window.removeEventListener('resize', calcLoopPoint);
      cleanupTouch();
      cleanupDrag();
      cleanupWheel();
      objContainer.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(numFrameId);
    };
  }, [numCopies, numSpeed]);

  return { refTrack: refContainer, events: {} };
};
