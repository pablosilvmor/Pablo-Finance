import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Delete, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: number;
  onConfirm: (value: number) => void;
  title?: string;
}

export const CalculatorDialog: React.FC<CalculatorDialogProps> = ({
  open,
  onOpenChange,
  initialValue,
  onConfirm,
  title = "R$"
}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [lastResult, setLastResult] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setExpression(initialValue > 0 ? initialValue.toString() : '');
      setLastResult(null);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (expression === '') {
      setDisplay('0,00');
      return;
    }
    if (expression === 'Erro') {
      setDisplay('Erro');
      return;
    }

    const hasOperators = /[+\-*/]/.test(expression);
    if (!hasOperators) {
      const num = parseFloat(expression);
      if (!isNaN(num)) {
        setDisplay(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } else {
        setDisplay(expression);
      }
    } else {
      setDisplay(expression);
    }
  }, [expression]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
      } else if (e.key === ',' || e.key === '.') {
        handleNumber('.');
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, expression]);

  const handleNumber = (num: string) => {
    if (lastResult !== null) {
      setExpression(num === '.' ? '0.' : num);
      setDisplay(num === '.' ? '0.' : num);
      setLastResult(null);
      return;
    }

    setExpression(prev => {
      if (!prev || prev === '0') {
        if (num === '.') return '0.';
        return num;
      }

      // Prevent multiple dots in the same number segment
      const parts = prev.split(/[\s+\-*/]/);
      const lastPart = parts[parts.length - 1];
      if (num === '.' && lastPart.includes('.')) return prev;
      
      return prev + num;
    });
  };

  const handleOperator = (op: string) => {
    setExpression(prev => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === '0') {
        if (op === '-') return '-'; // Allow negative numbers at start
        return '0';
      }
      const lastChar = trimmed.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        return trimmed.slice(0, -1) + op + ' ';
      }
      return trimmed + ' ' + op + ' ';
    });
    setLastResult(null);
  };

  const handleClear = () => {
    setExpression('');
    setLastResult(null);
  };

  const handleBackspace = () => {
    setExpression(prev => {
      if (!prev || prev === '0') return '';
      if (prev.endsWith(' ')) return prev.slice(0, -3);
      return prev.slice(0, -1);
    });
  };

  const calculate = () => {
    if (!expression) return null;
    try {
      // Basic sanitization and evaluation
      // Replace comma with dot for evaluation if any
      const sanitizedExpression = expression.replace(/,/g, '.');
      
      // Remove trailing operator if any
      const finalExpression = sanitizedExpression.trim().replace(/[\+\-\*\/]$/, '');
      
      // eslint-disable-next-line no-eval
      const result = eval(finalExpression);
      const numResult = Number(result);
      if (isNaN(numResult) || !isFinite(numResult)) throw new Error();
      
      const formattedResult = Number.isInteger(numResult) ? numResult.toString() : numResult.toFixed(2);
      setExpression(formattedResult);
      setLastResult(numResult);
      return numResult;
    } catch (e) {
      setExpression('Erro');
      return null;
    }
  };

  const handleConfirm = () => {
    const result = calculate();
    if (result !== null) {
      onConfirm(result);
      onOpenChange(false);
    }
  };

  const buttons = [
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '+', action: () => handleOperator('+'), color: 'text-zinc-400' },
    
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '-', action: () => handleOperator('-'), color: 'text-zinc-400' },
    
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '*', action: () => handleOperator('*'), color: 'text-zinc-400' },
    
    { label: ',', action: () => handleNumber('.') },
    { label: '0', action: () => handleNumber('0') },
    { label: '=', action: calculate, color: 'text-zinc-400' },
    { label: '/', action: () => handleOperator('/'), color: 'text-zinc-400' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-0 bg-[#1C1C1E] border-none rounded-3xl overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-lg">{title}</span>
            {/* Botão de fechar removido daqui para evitar duplicidade */}
          </div>

          <div className="relative bg-zinc-900/50 rounded-2xl p-4 min-h-[100px] flex flex-col justify-end">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute right-2 top-2 text-zinc-500 hover:text-white p-2 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-end space-y-1">
              <div className="text-zinc-500 text-sm h-5 overflow-hidden text-right w-full font-mono pr-8">
                {expression || '0'}
              </div>
              <div className="text-white text-4xl font-bold tracking-tight pr-8">
                {display}
              </div>
            </div>
            <button 
              onClick={handleBackspace}
              className="absolute right-2 bottom-2 text-zinc-500 hover:text-white p-2 transition-colors"
              title="Apagar"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className={cn(
                  "h-14 rounded-2xl flex items-center justify-center text-xl font-medium transition-colors hover:bg-zinc-800",
                  btn.color || "text-white"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full text-right text-[#ee5350] font-bold text-sm uppercase tracking-wider pt-2 hover:opacity-80"
          >
            CONCLUÍDO
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
