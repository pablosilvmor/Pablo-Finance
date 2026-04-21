import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon, Activity, BarChart2, ChevronLeft, ChevronRight, ChevronDown, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format, parseISO, isSameMonth, isSameYear, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, getDay, addMonths, subMonths, addYears, subYears, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { MonthPicker } from '@/components/MonthPicker';
import { toast } from 'sonner';

export const Charts = () => {
  const { transactions, categories, userSettings } = useAppStore();
  const [mainTab, setMainTab] = useState<'pie' | 'line' | 'bar'>('pie');
  
  // Sub tabs state
  const [pieTab, setPieTab] = useState<'expense_category' | 'income_category'>('expense_category');
  const [lineTab, setLineTab] = useState<'month' | 'year'>('month');
  const [barTab, setBarTab] = useState<'cashflow' | 'weekday'>('cashflow');

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const handlePrevDate = () => {
    if (mainTab === 'line' && lineTab === 'year') setSelectedDate(subYears(selectedDate, 1));
    else if (mainTab === 'bar' && barTab === 'cashflow') setSelectedDate(subYears(selectedDate, 1));
    else setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextDate = () => {
    if (mainTab === 'line' && lineTab === 'year') setSelectedDate(addYears(selectedDate, 1));
    else if (mainTab === 'bar' && barTab === 'cashflow') setSelectedDate(addYears(selectedDate, 1));
    else setSelectedDate(addMonths(selectedDate, 1));
  };

  const dateLabel = useMemo(() => {
    if (mainTab === 'line' && lineTab === 'year') return format(selectedDate, 'yyyy');
    if (mainTab === 'bar' && barTab === 'cashflow') return format(selectedDate, 'yyyy');
    return format(selectedDate, 'MMMM', { locale: ptBR }).toUpperCase();
  }, [selectedDate, mainTab, lineTab, barTab]);

  // --- PIE CHART DATA ---
  const pieData = useMemo(() => {
    const type = pieTab === 'expense_category' ? 'expense' : 'income';
    const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), selectedDate) && t.type === type);
    
    const categoryTotals = monthTransactions.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    const data = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        name: categories.find(c => c.id === categoryId)?.name || 'Outros',
        value: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: categories.find(c => c.id === categoryId)?.color || '#ccc'
      }))
      .sort((a, b) => b.value - a.value);

    return { data, total };
  }, [transactions, categories, selectedDate, pieTab]);

  // --- LINE CHART DATA ---
  const lineData = useMemo(() => {
    if (lineTab === 'month') {
      const days = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
      let total = 0;
      const data = days.map(day => {
        const dayTransactions = transactions.filter(t => t.type === 'expense' && isSameDay(parseISO(t.date), day));
        const amount = dayTransactions.reduce((acc, t) => acc + t.amount, 0);
        total += amount;
        return {
          date: format(day, 'dd MMM.', { locale: ptBR }),
          amount
        };
      });
      return { data, total };
    } else {
      const months = eachMonthOfInterval({ start: startOfYear(selectedDate), end: endOfYear(selectedDate) });
      let total = 0;
      const data = months.map(month => {
        const monthTransactions = transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), month));
        const amount = monthTransactions.reduce((acc, t) => acc + t.amount, 0);
        total += amount;
        return {
          date: format(month, 'MMM.', { locale: ptBR }).toUpperCase(),
          amount
        };
      });
      return { data, total };
    }
  }, [transactions, selectedDate, lineTab]);

  // --- BAR CHART DATA ---
  const cashflowData = useMemo(() => {
    const months = eachMonthOfInterval({ start: startOfYear(selectedDate), end: endOfYear(selectedDate) });
    return months.map(month => {
      const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), month));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return {
        month: format(month, 'MMM.', { locale: ptBR }).toUpperCase(),
        Receitas: income,
        Despesas: -expense, // Negative for the chart
        Balanco: income - expense
      };
    });
  }, [transactions, selectedDate]);

  const weekdayData = useMemo(() => {
    const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), selectedDate) && t.type === 'expense');
    const days = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
    const totals = new Array(7).fill(0);
    
    monthTransactions.forEach(t => {
      const dayIndex = getDay(parseISO(t.date));
      totals[dayIndex] += t.amount;
    });

    return days.map((day, index) => ({
      day,
      amount: totals[index]
    }));
  }, [transactions, selectedDate]);


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pb-20 text-zinc-900 dark:text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gráficos</h1>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
          <Filter 
            className="w-5 h-5 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" 
            onClick={() => {
              toast.info('Filtros Avançados', {
                description: 'Funcionalidade em desenvolvimento: Filtrar por tags, contas ou valores.'
              });
            }}
          />
          <CalendarIcon 
            className="w-5 h-5 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors" 
            onClick={() => setIsMonthPickerOpen(true)}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="flex bg-secondary rounded-full p-1 max-w-md mx-auto">
          <button 
            onClick={() => setMainTab('pie')}
            className={`flex-1 flex justify-center py-2 rounded-full transition-colors ${mainTab === 'pie' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <PieChartIcon className={`w-5 h-5 ${mainTab === 'pie' ? 'text-primary' : ''}`} />
          </button>
          <button 
            onClick={() => setMainTab('line')}
            className={`flex-1 flex justify-center py-2 rounded-full transition-colors ${mainTab === 'line' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Activity className={`w-5 h-5 ${mainTab === 'line' ? 'text-primary' : ''}`} />
          </button>
          <button 
            onClick={() => setMainTab('bar')}
            className={`flex-1 flex justify-center py-2 rounded-full transition-colors ${mainTab === 'bar' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart2 className={`w-5 h-5 ${mainTab === 'bar' ? 'text-foreground' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="mb-8 overflow-x-auto scrollbar-none flex justify-center">
        <div className="flex gap-2 min-w-max">
          {mainTab === 'pie' && (
            <>
              <button onClick={() => setPieTab('expense_category')} className={`px-4 py-2 rounded-full text-sm transition-colors ${pieTab === 'expense_category' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Despesas por categoria</button>
              <button onClick={() => setPieTab('income_category')} className={`px-4 py-2 rounded-full text-sm transition-colors ${pieTab === 'income_category' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Receitas por categoria</button>
            </>
          )}
          {mainTab === 'line' && (
            <>
              <button onClick={() => setLineTab('month')} className={`px-4 py-2 rounded-full text-sm transition-colors ${lineTab === 'month' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Despesas do mês</button>
              <button onClick={() => setLineTab('year')} className={`px-4 py-2 rounded-full text-sm transition-colors ${lineTab === 'year' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Despesas por ano</button>
            </>
          )}
          {mainTab === 'bar' && (
            <>
              <button onClick={() => setBarTab('cashflow')} className={`px-4 py-2 rounded-full text-sm transition-colors ${barTab === 'cashflow' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Fluxo de caixa anual</button>
              <button onClick={() => setBarTab('weekday')} className={`px-4 py-2 rounded-full text-sm transition-colors ${barTab === 'weekday' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>Despesas x dia semana</button>
            </>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <button onClick={handlePrevDate} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <span 
          className="text-sm font-medium tracking-wider uppercase cursor-pointer select-none hover:text-[#8B5CF6] transition-colors"
          onClick={() => setIsMonthPickerOpen(true)}
        >
          {dateLabel}
        </span>
        <button onClick={handleNextDate} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Chart Area */}
      <div className="bg-card rounded-3xl p-6 shadow-sm">
        {mainTab === 'pie' && (
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="relative w-64 h-64 mb-8 min-w-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.data.length > 0 ? pieData.data : [{ name: 'Sem dados', value: 1, color: '#e4e4e7' }]}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {(pieData.data.length > 0 ? pieData.data : [{ name: 'Sem dados', value: 1, color: '#e4e4e7' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {pieData.data.length > 0 && (
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const value = payload[0].value as number;
                          const percentage = pieData.total > 0 ? ((value / pieData.total) * 100).toFixed(1) : '0.0';
                          return (
                            <div style={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                              borderRadius: '12px', 
                              border: '1px solid #333',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                              padding: '12px'
                            }}>
                              <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{data.name}</p>
                              <p style={{ color: data.color || (payload[0] as any).color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                Valor: {userSettings.showValues ? new Intl.NumberFormat(userSettings.language || 'pt-BR', { style: 'currency', currency: userSettings.currency || 'BRL' }).format(value) : '•••••'} ({percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-sm font-medium ${pieTab === 'expense_category' ? 'text-[#ee5350]' : 'text-[#01bfa5]'}`}>
                  {userSettings.showValues ? `R$ ${pieData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                  Total <ChevronDown className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              {pieData.data.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                      <span className="text-white text-xs font-bold">{item.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Porcentagem</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${pieTab === 'expense_category' ? 'text-[#ee5350]' : 'text-[#01bfa5]'}`}>
                      {userSettings.showValues ? `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{userSettings.showValues ? `${item.percentage.toFixed(2)}%` : '••%'}</p>
                  </div>
                </div>
              ))}
              {pieData.data.length === 0 && (
                <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm py-4">Nenhum dado encontrado para este período.</p>
              )}
            </div>
          </div>
        )}

        {mainTab === 'line' && (
          <div className="max-w-4xl mx-auto">
            <div className="h-[400px] w-full mb-4 min-w-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-[#333]" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => userSettings.showValues ? `R$${val}` : 'R$••'} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const value = payload[0].value as number;
                        const percentage = lineData.total > 0 ? ((value / lineData.total) * 100).toFixed(1) : '0.0';
                        return (
                          <div style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                            borderRadius: '12px', 
                            border: '1px solid #333',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            padding: '12px'
                          }}>
                            <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{data.date}</p>
                            <p style={{ color: '#00b4d8', fontWeight: '500', margin: 0, fontSize: '14px' }}>
                              Quantia: {userSettings.showValues ? new Intl.NumberFormat(userSettings.language || 'pt-BR', { style: 'currency', currency: userSettings.currency || 'BRL' }).format(value) : '•••••'} ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#00b4d8" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total <span className="text-zinc-900 dark:text-white font-medium">{userSettings.showValues ? `R$ ${lineData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ •••••'}</span></p>
          </div>
        )}

        {mainTab === 'bar' && barTab === 'cashflow' && (
          <div className="h-[400px] w-full max-w-4xl mx-auto min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflowData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-[#333]" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => userSettings.showValues ? `R$${val}` : 'R$••'} />
                <Tooltip 
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
                    const color = props.payload?.color || props.color;
                    const content = userSettings.showValues ? `${value.toLocaleString('pt-BR', { style: 'currency', currency: userSettings.currency })}` : 'R$ •••••';
                    return [
                      <span style={{ color }}>{content}</span>,
                      <span style={{ color }}>{name}</span>
                    ];
                  }}
                />
                <Bar dataKey="Receitas" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Despesas" fill="#f87171" radius={[0, 0, 4, 4]} maxBarSize={30} />
                <Line type="monotone" dataKey="Balanco" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {mainTab === 'bar' && barTab === 'weekday' && (
          <div className="h-[400px] w-full max-w-4xl mx-auto min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-[#333]" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => userSettings.showValues ? `R$${val}` : 'R$••'} />
                <Tooltip 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                    borderRadius: '12px', 
                    border: '1px solid #333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: '600' }}
                  cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const total = weekdayData.reduce((acc, cur) => acc + cur.amount, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    const color = props.payload?.color || props.color;
                    const content = userSettings.showValues ? `${value.toLocaleString('pt-BR', { style: 'currency', currency: userSettings.currency })} (${percentage}%)` : 'R$ •••••';
                    return [
                      <span style={{ color }}>{content}</span>,
                      <span style={{ color }}>{name}</span>
                    ];
                  }}
                />
                <Bar dataKey="amount" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
