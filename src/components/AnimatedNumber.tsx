import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

export function AnimatedNumber({ 
  value, 
  formatter 
}: { 
  value: number; 
  formatter: (v: number) => string;
}) {
  const displayValue = useMotionValue(0);
  const display = useTransform(displayValue, (current) => formatter(current));

  useEffect(() => {
    displayValue.set(0); // Start from 0 on every change explicitly
    const controls = animate(displayValue, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [displayValue, value]);

  return <motion.span>{display}</motion.span>;
}
