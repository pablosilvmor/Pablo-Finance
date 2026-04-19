import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

const MONTHS = [
  'JAN.', 'FEV.', 'MAR.', 'ABR.', 'MAI.', 'JUN.',
  'JUL.', 'AGO.', 'SET.', 'OUT.', 'NOV.', 'DEZ.'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ open, onOpenChange, selectedDate, onSelect }) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [isYearSelection, setIsYearSelection] = useState(false);

  const handlePrevYear = () => setViewYear(prev => prev - 1);
  const handleNextYear = () => setViewYear(prev => prev + 1);

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = setMonth(setYear(selectedDate, viewYear), monthIndex);
    onSelect(newDate);
    onOpenChange(false);
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setIsYearSelection(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    onSelect(now);
    onOpenChange(false);
  };

  const years = Array.from({ length: 12 }, (_, i) => viewYear - 5 + i);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setIsYearSelection(false);
    }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[360px] p-0 bg-[#3A3A3C] border-none rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-[#8B5CF6] p-4 flex items-center justify-between text-white">
          <Button variant="ghost" size="icon" onClick={handlePrevYear} className="hover:bg-white/20 text-white rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <button 
            onClick={() => setIsYearSelection(!isYearSelection)}
            className="font-medium text-lg hover:bg-white/20 px-4 py-1 rounded-lg transition-colors"
          >
            {viewYear}
          </button>
          <Button variant="ghost" size="icon" onClick={handleNextYear} className="hover:bg-white/20 text-white rounded-full">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6">
          {isYearSelection ? (
            <div className="grid grid-cols-3 gap-4">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleSelectYear(year)}
                  className={`py-3 text-sm font-medium rounded-xl transition-colors ${viewYear === year ? 'bg-[#8B5CF6] text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {MONTHS.map((month, index) => {
                const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === viewYear;
                return (
                  <button
                    key={month}
                    onClick={() => handleSelectMonth(index)}
                    className={`text-sm font-medium transition-colors ${isSelected ? 'text-[#8B5CF6]' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-end gap-4 mt-8">
            <button 
              onClick={() => onOpenChange(false)}
              className="text-sm font-bold text-[#8B5CF6] hover:text-purple-400 uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCurrentMonth}
              className="text-sm font-bold text-[#8B5CF6] hover:text-purple-400 uppercase tracking-wider"
            >
              Mês Atual
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
