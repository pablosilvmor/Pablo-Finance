import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

interface TransactionMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'expense' | 'income' | 'piggy-bank') => void;
}

export const TransactionMenuOverlay = ({ isOpen, onClose, onSelect }: TransactionMenuOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-start justify-center pb-8 sm:pt-24"
          onClick={onClose}
        >
          <div className="relative w-full max-w-md h-80 sm:h-80" onClick={e => e.stopPropagation()}>
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={onClose} 
              className="absolute bottom-0 sm:top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#9810FA] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#850ddb] transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </motion.button>

            {/* Receita */}
            <motion.button 
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 50, x: 20 }}
              transition={{ delay: 0.05 }}
              onClick={() => onSelect('income')} 
              className="absolute bottom-24 sm:top-24 left-[10%] sm:left-[15%] flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 bg-[#3A3A3C] rounded-full flex items-center justify-center hover:bg-[#4A4A4C] transition-colors">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-white text-sm font-medium">Receita</span>
            </motion.button>

            {/* Cofrinho */}
            <motion.button 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ delay: 0.08 }}
              onClick={() => onSelect('piggy-bank')} 
              className="absolute bottom-32 sm:top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 bg-[#3A3A3C] rounded-full flex items-center justify-center hover:bg-[#4A4A4C] transition-colors">
                <PiggyBank className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-white text-sm font-medium">Cofrinho</span>
            </motion.button>

            {/* Despesa */}
            <motion.button 
              initial={{ opacity: 0, y: 50, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 50, x: -20 }}
              transition={{ delay: 0.1 }}
              onClick={() => onSelect('expense')} 
              className="absolute bottom-24 sm:top-24 right-[10%] sm:right-[15%] flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 bg-[#3A3A3C] rounded-full flex items-center justify-center hover:bg-[#4A4A4C] transition-colors">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-white text-sm font-medium">Despesa</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
