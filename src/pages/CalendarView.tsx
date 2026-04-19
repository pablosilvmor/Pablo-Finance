import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const CalendarView = () => {
  const navigate = useNavigate();
  const { transactions, userSettings, tags } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<string>('Todos');

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const getDays = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(currentDate);
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  };
  const days = getDays();

  const getTransactionsForDay = (day: Date) => {
    return transactions.filter(t => {
      if (!isSameDay(new Date(t.date), day)) return false;
      if (filterType === 'Receitas' && t.type !== 'income') return false;
      if (filterType === 'Despesas' && t.type !== 'expense') return false;
      if (filterType !== 'Todos' && filterType !== 'Receitas' && filterType !== 'Despesas') {
        const tagName = filterType.replace('Tag: ', '');
        const tag = tags.find(tag => tag.name === tagName);
        if (!tag || !t.tags?.includes(tag.id)) return false;
      }
      return true;
    });
  };

  const calculateProjectedBalance = () => {
    const startOfPeriod = days[0];
    const endOfPeriod = days[days.length - 1];
    
    // Filtra transações que estão dentro do período visualizado
    const relevantTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startOfPeriod && tDate <= endOfPeriod;
    });

    const totalIncome = relevantTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = relevantTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return totalIncome - totalExpense;
  };
  
  const projectedBalance = calculateProjectedBalance();

  const handleDayClick = (day: Date) => {
    // Navigate to transactions with a state to open the new transaction dialog with this date
    navigate('/transactions', { state: { openNew: true, date: format(day, 'yyyy-MM-dd') } });
  };

  const formatValue = (value: number) => {
    if (!userSettings.showValues) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Calendário Inteligente
        </h1>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-full p-1 border border-zinc-200 dark:border-zinc-800">
          <Button 
            variant={viewMode === 'month' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-full px-4 h-8"
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-full px-4 h-8"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-3 bg-secondary rounded-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Projeção Final</p>
            <p className={cn("font-bold text-lg", projectedBalance >= 0 ? "text-green-500" : "text-red-500")}>
              {formatValue(projectedBalance)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Receitas">Receitas</SelectItem>
              <SelectItem value="Despesas">Despesas</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag.id} value={`Tag: ${tag.name}`}>Tag: {tag.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <CardTitle className="text-xl font-bold capitalize text-foreground">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
              : `Semana de ${format(days[0], 'dd/MM')} a ${format(days[days.length-1], 'dd/MM')}`
            }
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev} className="bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-7 border-b border-border">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[120px]">
              {days.map((day, dayIdx) => {
              const dayTransactions = getTransactionsForDay(day);
              const hasTransactions = dayTransactions.length > 0;
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              const incomeTotal = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
              const expenseTotal = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

              return (
                <div 
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "border-b border-r border-border p-2 transition-colors relative",
                    !isCurrentMonth && "bg-secondary/30 text-muted-foreground",
                    isToday(day) && "bg-primary/10",
                    hasTransactions && "cursor-pointer hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {/* Flow Indicator */}
                      <div className="flex h-1 w-full max-w-[20px] rounded-full overflow-hidden mt-1 bg-zinc-100 dark:bg-zinc-800">
                        {incomeTotal > 0 && <div className="h-full bg-green-500" style={{ width: expenseTotal === 0 ? '100%' : '50%' }} />}
                        {expenseTotal > 0 && <div className="h-full bg-red-500" style={{ width: incomeTotal === 0 ? '100%' : '50%' }} />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {incomeTotal > 0 && (
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded truncate">
                        + {formatValue(incomeTotal)}
                      </div>
                    )}
                    {expenseTotal > 0 && (
                      <div className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded truncate">
                        - {formatValue(expenseTotal)}
                      </div>
                    )}
                  </div>
                  
                  {hasTransactions && (
                    <div className="absolute bottom-2 right-2 flex -space-x-1">
                      {dayTransactions.slice(0, 3).map((t, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-2 h-2 rounded-full border border-white dark:border-zinc-900",
                            t.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                          )}
                        />
                      ))}
                      {dayTransactions.length > 3 && (
                        <div className="w-2 h-2 rounded-full border border-white dark:border-zinc-900 bg-zinc-400" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 items-center justify-center pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          Receitas
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          Despesas
        </div>
      </div>
    </div>
  );
};
