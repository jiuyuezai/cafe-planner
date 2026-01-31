import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between mb-2 px-2">
        <span className="font-varela text-stone-500 text-sm font-bold tracking-wider">今日营业元气值</span>
        <span className="font-varela text-pink-500 text-sm font-bold">{Math.round(progress)}%</span>
      </div>
      <div className="h-7 bg-white rounded-full p-1.5 shadow-inner border-2 border-pink-100 overflow-visible relative">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-pink-300 to-rose-400 relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', bounce: 0.5, damping: 12 }}
        >
          {/* Liquid highlight effect */}
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-white opacity-30 rounded-full mx-1 mt-[1px]" />
          
          {/* Mascot sitting on the progress bar */}
          <motion.div 
            className="absolute -right-3 -top-5 text-2xl filter drop-shadow-sm select-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
            transition={{ 
                scale: { type: 'spring' },
                rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            🍰
          </motion.div>

          {/* Bubbles particle effect */}
          {progress > 0 && (
             <motion.div 
               className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full opacity-50"
               animate={{ y: [0, -8, 0], x: [0, -2, 2, 0], opacity: [0.6, 0, 0] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
             />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressBar;