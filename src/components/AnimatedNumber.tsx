import React, { useEffect, useState } from 'react';

export function AnimatedNumber({ 
  value, 
  formatter 
}: { 
  value: number; 
  formatter: (v: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number;
    const duration = 800; // ms
    const initialValue = displayValue;
    const distance = value - initialValue;

    if (distance === 0) return;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(initialValue + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, [value]);

  return <span>{formatter(displayValue)}</span>;
}
