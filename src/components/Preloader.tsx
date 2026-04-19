import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-[#1C1C1E] flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.img
              src="https://i.imgur.com/rltsQSg.png"
              alt="Logo"
              className="w-24 h-24 object-contain"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
            <motion.img
              src="https://i.imgur.com/kJHoB4m.png"
              alt="Dindin"
              className="h-12 object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </motion.div>
          <motion.div
            className="absolute bottom-12 w-12 h-1 bg-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 48 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
