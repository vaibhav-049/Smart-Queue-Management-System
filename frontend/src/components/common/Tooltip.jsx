import { useState } from 'react';
import './Tooltip.css';

export default function Tooltip({ text, children, position = 'bottom' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
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
