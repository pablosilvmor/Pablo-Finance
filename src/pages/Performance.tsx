import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useAppStore } from '@/lib/store';
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth, isSameYear, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthPicker } from '@/components/MonthPicker';
import { useNavigate } from 'react-router';

export const Performance = () => {
  const navigate = useNavigate();
  const { activeTransactions: transactions, categories, userSettings } = useAppStore();
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(value);
  };

  const performanceData = useMemo(() => {
    if (viewMode === 'monthly') {
      // Last 6 months from selectedDate
      const months = Array.from({ length: 6 }).map((_, i) => subMonths(selectedDate, 5 - i));
      
      return months.map(monthDate => {
        const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), monthDate));
        const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        return {
          month: format(monthDate, 'MMM', { locale: ptBR }),
          income,
          expense
        };
      });
    } else {
      // Current year of selectedDate month by month
      const months = eachMonthOfInterval({
        start: startOfYear(selectedDate),
        end: endOfYear(selectedDate)
      });

      return months.map(monthDate => {
        const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), monthDate));
        const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        return {
          month: format(monthDate, 'MMM', { locale: ptBR }),
          income,
          expense
        };
      });
    }
  }, [transactions, viewMode, selectedDate]);

  const stats = useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), selectedDate));
    const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalSavings = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      totalSavings
    };
  }, [transactions, selectedDate]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Meu Desempenho</h1>
        <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 border border-primary rounded-full px-2 py-1 text-white">
          <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-1 hover:bg-primary/20 rounded-full">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          
          <div className="cursor-pointer text-md font-bold capitalize px-2" onClick={() => setIsMonthPickerOpen(true)}>
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          
          <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-1 hover:bg-primary/20 rounded-full">
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all" onClick={() => navigate('/incomes')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-[#01bfa5]/10 dark:bg-[#01bfa5]/20 flex items-center justify-center text-[#01bfa5]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Receitas do Mês</p>
            <h3 className="text-2xl font-bold text-[#01bfa5]">
              {formatCurrency(stats.totalIncome)}
            </h3>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all" onClick={() => navigate('/expenses')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ee5350]/10 dark:bg-[#ee5350]/20 flex items-center justify-center text-[#ee5350]">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Despesas do Mês</p>
            <h3 className="text-2xl font-bold text-[#ee5350]">
              {formatCurrency(stats.totalExpense)}
            </h3>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Balanço do Mês</p>
            <h3 className="text-2xl font-bold text-[#50A2FF]">
              {formatCurrency(stats.totalSavings)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">Evolução Financeira</CardTitle>
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-full">
            <button 
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${viewMode === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              6 Meses
            </button>
            <button 
              onClick={() => setViewMode('annual')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${viewMode === 'annual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ano
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#01bfa5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#01bfa5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ee5350" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ee5350" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-muted-foreground" />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'currentColor' }} 
                  className="text-muted-foreground"
                  tickFormatter={(value) => userSettings.showValues ? new Intl.NumberFormat(userSettings.language, { style: 'currency', currency: userSettings.currency, maximumFractionDigits: 0 }).format(value) : '•••••'}
                />
                <Tooltip 
                  trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    borderRadius: '12px', 
                    border: '1px solid #333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: '600' }}
                  formatter={(value: number, name: string, props: any) => {
                    const totalIncome = performanceData.reduce((acc, cur) => acc + cur.income, 0);
                    const totalExpense = performanceData.reduce((acc, cur) => acc + cur.expense, 0);
                    const total = name === 'income' ? totalIncome : totalExpense;
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    const translatedName = name === 'income' ? 'Receita' : name === 'expense' ? 'Despesa' : name;
                    const color = props.color;
                    return [
                      <span key="val" style={{ color }}>{`${formatCurrency(value)} ${userSettings.showValues ? `(${percentage}%)` : ''}`}</span>,
                      <span key="name" style={{ color }}>{translatedName}</span>
                    ];
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#01bfa5" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#ee5350" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Maiores Gastos do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {useMemo(() => {
              const currentMonthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), selectedDate));
              const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
              
              if (expenses.length === 0) {
                return <p className="text-zinc-400 text-center py-4">Nenhum gasto registrado neste mês.</p>;
              }

              const categoryTotals = expenses.reduce((acc, t) => {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
                return acc;
              }, {} as Record<string, number>);

              const sortedCategories = Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);

              const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

              return sortedCategories.map(([categoryId, amount], i) => {
                const category = categories.find(c => c.id === categoryId)?.name || 'Outros';
                const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <div key={categoryId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{category}</span>
                      <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              });
            }, [transactions, categories, selectedDate])}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Projeção Próximo Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">
                {formatCurrency(useMemo(() => {
                  const today = new Date();
                  const last3Months = Array.from({ length: 3 }).map((_, i) => subMonths(today, i + 1));
                  
                  const savingsHistory = last3Months.map(monthDate => {
                    const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), monthDate));
                    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                    return income - expense;
                  });

                  const avgSavings = savingsHistory.reduce((acc, s) => acc + s, 0) / savingsHistory.length;
                  return isNaN(avgSavings) ? 0 : avgSavings;
                }, [transactions]))}
              </h4>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Baseado na média de economia dos seus últimos 3 meses.
              </p>
              <Button 
                className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                onClick={() => navigate('/charts')}
              >
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <MonthPicker 
        open={isMonthPickerOpen} 
        onOpenChange={setIsMonthPickerOpen} 
        selectedDate={selectedDate} 
        onSelect={setSelectedDate} 
      />
    </motion.div>
  );
};
