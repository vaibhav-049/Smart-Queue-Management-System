import { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export default function Tooltip({ text, children, position = 'bottom' }) {
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const isTouchRef = useRef(false);

  const showTooltip = () => {
    // If we recently touched, block the simulated mouse enter/focus
    if (isTouchRef.current) return;
    // Also strictly block hover-based tooltips on mobile widths
    if (window.innerWidth <= 768) return;
    setVisible(true);
  };

  const hideTooltip = () => {
    if (isTouchRef.current) return;
    setVisible(false);
  };

  const handleTouch = () => {
    isTouchRef.current = true;
    setVisible(true);
    
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    
    // Show exactly for 0.5s on mobile
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      // Keep touch flag active longer to block delayed simulated mouse events
      setTimeout(() => { isTouchRef.current = false; }, 2000);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onTouchStart={handleTouch}
    >
      {children}
      {visible && (
        <span className={`tooltip-bubble tooltip-${position}`} role="tooltip">
          {text}
        </span>
      )}
    </div>
  );
}
