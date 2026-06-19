import { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export default function Tooltip({ text, children, position = 'bottom' }) {
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const isTouchRef = useRef(false);

  const showTooltip = () => {
    if (isTouchRef.current) return;
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
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      // Reset touch flag shortly after hiding so subsequent touches work
      setTimeout(() => { isTouchRef.current = false; }, 100);
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
