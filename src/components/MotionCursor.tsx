import { useEffect, useRef, useState } from 'react';

/**
 * Custom dot cursor that follows the mouse on desktop.
 * Grows into a labelled pill over interactive elements.
 * Hidden entirely on touch devices and when reduced motion is on.
 */
export function MotionCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [label, setLabel] = useState('');
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return;

    const cursor = cursorRef.current!;
    const labelEl = labelRef.current!;

    const onMouseMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      labelEl.style.left = e.clientX + 'px';
      labelEl.style.top = e.clientY + 'px';
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => {
      setIsVisible(false);
      setIsHover(false);
      setLabel('');
    };

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseenter', onMouseEnter, true);
    document.body.addEventListener('mouseleave', onMouseLeave, true);

    // mouseover/mouseout bubble, so we can delegate to dynamically rendered buttons/cards
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const closest = target.closest<HTMLElement>('button, a, .fc-cat-card');
      if (closest) {
        const lbl =
          closest.getAttribute('aria-label') ||
          closest.textContent?.trim() ||
          'View';
        setLabel(lbl);
        setIsHover(true);
      }
    };
    const onMouseOut = () => {
      setIsHover(false);
      setLabel('');
    };

    document.body.addEventListener('mouseover', onMouseOver, true);
    document.body.addEventListener('mouseout', onMouseOut, true);

    return () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseenter', onMouseEnter, true);
      document.body.removeEventListener('mouseleave', onMouseLeave, true);
      document.body.removeEventListener('mouseover', onMouseOver, true);
      document.body.removeEventListener('mouseout', onMouseOut, true);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className={`fc-cursor ${isVisible ? 'is-visible' : ''} ${
          isHover ? 'is-hover' : ''
        }`}
      />
      <div
        ref={labelRef}
        className={`fc-cursor-label ${isVisible ? 'is-visible' : ''}`}
      >
        {label}
      </div>
    </>
  );
}
