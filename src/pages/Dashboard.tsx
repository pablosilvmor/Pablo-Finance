import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, CreditCardIcon, WalletIcon, Sparkles, Loader2, Eye, EyeOff, Plus, ChevronLeft, ChevronRight, ChevronDown, Activity, BellRing, Trophy, Target, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Label, LineChart, Line, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSpendingInsights } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router';
import { MonthPicker } from '@/components/MonthPicker';
import { useTranslation } from '@/lib/i18n';
import { PrivacyPasswordDialog } from '@/components/PrivacyPasswordDialog';
import { motion, animate } from 'motion/react';
import { parseISO } from 'date-fns';

const AnimatedValue = ({ value, userSettings }: { value: number, userSettings: any }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!userSettings.showValues) {
      setDisplayValue(value);
      return;
    }
    
    // Animate from displayValue to value
    const controls = animate(displayValue, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1], // Custom ease out for a "natural" count feel
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value, userSettings.showValues]);

  const format = (val: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    // Prevent -R$ 0,00 by normalizing values very close to zero
    const normalizedVal = Math.abs(val) < 0.005 ? 0 : val;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(normalizedVal);
  };

  return <span>{format(displayValue)}</span>;
};

export const Dashboard = () => {
  const { activeTransactions: allTransactions, costCenters, categories, tags, userSettings, monthlyPlan, viewDate: currentDate, setViewDate: setCurrentDate } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('all');
  const navigate = useNavigate();

  const transactions = useMemo(() => {
    if (selectedCostCenterId === 'all') return allTransactions;
    return allTransactions.filter(t => t.costCenterId === selectedCostCenterId);
  }, [allTransactions, selectedCostCenterId]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    if (t.ignored) return false;
    const d = parseISO(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const incomesMonth = monthlyTransactions.filter(t => t.type === 'income');
  const expensesMonth = monthlyTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomesMonth.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expensesMonth.reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = allTransactions
    .filter(t => {
      if (t.ignored) return false;
      const d = parseISO(t.date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth();
      
      const cYear = currentDate.getFullYear();
      const cMonth = currentDate.getMonth();

      if (tYear < cYear) return true;
      if (tYear === cYear && tMonth <= cMonth) return true;
      return false;
    })
    .reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

  const monthlyBalance = totalIncome - totalExpense;

  const incomeCount = incomesMonth.length;
  const expenseCount = expensesMonth.length;

  const monthName = new Intl.DateTimeFormat(userSettings.language, { month: 'long' }).format(currentDate);
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  
  const activeAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (!monthlyPlan || monthlyPlan.budgets.length === 0) return alerts;

    monthlyPlan.budgets.forEach(b => {
      const catExpense = monthlyTransactions
        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((acc, t) => acc + t.amount, 0);
      
      if (b.limit > 0 && catExpense >= b.limit * 0.9) {
        const category = categories.find(c => c.id === b.categoryId);
        if (category) {
           alerts.push(`Atenção, você já gastou ${((catExpense/b.limit)*100).toFixed(0)}% do seu orçamento de ${category.name} e ainda estamos no dia ${today.getDate()}!`);
        }
      }
    });
    return alerts;
  }, [monthlyPlan, monthlyTransactions, categories]);

  const achievements = useMemo(() => {
    const items = [];
    if (totalBalance >= 10000) items.push({ id: '10k', title: 'Poupador Pro', desc: 'Acumulou mais de R$10k', bg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' });
    if (totalBalance >= 50000) items.push({ id: '50k', title: 'Mestre', desc: 'Acumulou mais de R$50k', bg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' });
    if (monthlyBalance > 0) items.push({ id: 'blue', title: 'Mês no Azul', desc: 'Gastou menos do que ganhou', bg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' });
    return items;
  }, [totalBalance, monthlyBalance]);

  // Data for Bar Chart
  const barData = [
    { name: t('incomes'), value: totalIncome, color: '#01bfa5' },
    { name: t('expenses'), value: totalExpense, color: '#ee5350' }
  ];

  // Data for Yearly Chart
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const yearlyData = months.map((month, index) => {
    const monthTransactions = transactions.filter(t => {
      if (t.ignored) return false;
      const d = new Date(t.date);
      return d.getMonth() === index && d.getFullYear() === currentYear;
    });
    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { name: month, income, expense, balance: income - expense };
  });

  // Data for Chart (Expenses)
  const pieDataExpenses = React.useMemo(() => {
    const categoryTotals = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Desconhecido',
          value: amount,
          color: category?.color || '#ccc',
        };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [monthlyTransactions, categories]);

  // Data for Chart (Incomes)
  const pieDataIncomes = React.useMemo(() => {
    const categoryTotals = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Desconhecido',
          value: amount,
          color: category?.color || '#ccc',
        };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [monthlyTransactions, categories]);

  const { whoOwesMe, iOweThem } = React.useMemo(() => {
    let whoOwesMeCalc = 0;
    let iOweThemCalc = 0;

    transactions.forEach(t => {
      if (!t.split || t.ignored) return;
      
      const getAmount = (p: any) => {
        if (t.split!.type === 'equal') return t.amount / t.split!.participants.length;
        if (t.split!.type === 'percentage') return (t.amount * (p.percentage || 0)) / 100;
        return p.amount || 0;
      };

      t.split.participants.forEach(p => {
        const name = p.name.trim().toLowerCase();
        if (name === 'eu' || name === 'mim' || name === '') return;

        const amount = getAmount(p);
        const pendingAmount = amount - (p.paidAmount || 0);

        if (pendingAmount < 0.01) return;

        if (t.type === 'expense') {
          whoOwesMeCalc += pendingAmount;
        } else if (t.type === 'income') {
          iOweThemCalc += pendingAmount;
        }
      });
    });

    return { whoOwesMe: whoOwesMeCalc, iOweThem: iOweThemCalc };
  }, [transactions]);

  const handleGenerateInsights = async () => {
    if (insights) return;
    setLoadingInsights(true);
    const result = await getSpendingInsights(monthlyTransactions, categories);
    setInsights(result);
    setLoadingInsights(false);
  };

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    // Prevent -R$ 0,00 by normalizing values very close to zero
    const normalizedVal = Math.abs(value) < 0.005 ? 0 : value;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(normalizedVal);
  };

  const renderCard = (id: string) => {
    switch (id) {
      case 'category-expenses':
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t('expensesByCategory')}</CardTitle>
                {pieDataExpenses.length > 5 && (
                  <div className="text-sm text-[#ee5350] font-bold mt-1">
                    {formatCurrency(pieDataExpenses.reduce((acc, cur) => acc + cur.value, 0))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/reports', { state: { tab: 'categories' } })}
                className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors tracking-wider"
              >
                Ver mais
              </button>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full min-h-[320px] min-w-0">
                {pieDataExpenses.length > 5 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pieDataExpenses} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <Tooltip 
                        trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const value = payload[0].value as number;
                            const total = pieDataExpenses.reduce((acc, cur) => acc + cur.value, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return (
                              <div style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                borderRadius: '12px', 
                                border: '1px solid #333',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                padding: '12px'
                              }}>
                                <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{data.name}</p>
                                <p style={{ color: data.color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                  {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {pieDataExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : pieDataExpenses.length > 0 ? (
                  <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataExpenses}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieDataExpenses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          offset={10}
                          allowEscapeViewBox={{ x: true, y: true }}
                          trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                          content={(props: any) => { const { active, payload, coordinate, viewBox } = props;
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const value = payload[0].value as number;
                              const total = pieDataExpenses.reduce((acc, cur) => acc + cur.value, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              
                              const vw = viewBox?.width || 300;
                              const vh = viewBox?.height || 280;
                              const cx = viewBox?.cx ?? vw / 2;
                              const cy = viewBox?.cy ?? vh / 2;
                              const coordX = coordinate?.x ?? cx;
                              const coordY = coordinate?.y ?? cy;
                              
                              const isLeft = coordX < cx;
                              const isTop = coordY < cy;
                              
                              const translateX = isLeft 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordX - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vw - 20 - coordX)}px - 100%))`;
                                
                              const translateY = isTop 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordY - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vh - 20 - coordY)}px - 100%))`;

                              return (
                                <div style={{
                                  transform: `translate(${translateX}, ${translateY})`,
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                  borderRadius: '12px', 
                                  border: '1px solid #333',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  padding: '12px',
                                  width: 'max-content',
                                  pointerEvents: 'none',
                                  zIndex: 1000
                                }}>
                                  <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{data.name}</p>
                                  <p style={{ color: data.color || (payload[0] as any).color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                    {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-[#ee5350]">
                        {formatCurrency(pieDataExpenses.reduce((acc, cur) => acc + cur.value, 0))}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">
                        Total <ChevronDown className="w-3 h-3 inline-block" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                    {t('noExpenses')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'category-incomes':
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t('incomesByCategory')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full min-h-[320px] min-w-0">
                {pieDataIncomes.length > 0 ? (
                  <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataIncomes}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieDataIncomes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          offset={10}
                          allowEscapeViewBox={{ x: true, y: true }}
                          trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                          content={(props: any) => { const { active, payload, coordinate, viewBox } = props;
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const value = payload[0].value as number;
                              const total = pieDataIncomes.reduce((acc, cur) => acc + cur.value, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              
                              const vw = viewBox?.width || 300;
                              const vh = viewBox?.height || 280;
                              const cx = viewBox?.cx ?? vw / 2;
                              const cy = viewBox?.cy ?? vh / 2;
                              const coordX = coordinate?.x ?? cx;
                              const coordY = coordinate?.y ?? cy;
                              
                              const isLeft = coordX < cx;
                              const isTop = coordY < cy;
                              
                              const translateX = isLeft 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordX - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vw - 20 - coordX)}px - 100%))`;
                                
                              const translateY = isTop 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordY - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vh - 20 - coordY)}px - 100%))`;

                              return (
                                <div style={{
                                  transform: `translate(${translateX}, ${translateY})`,
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                  borderRadius: '12px', 
                                  border: '1px solid #333',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  padding: '12px',
                                  width: 'max-content',
                                  pointerEvents: 'none',
                                  zIndex: 1000
                                }}>
                                  <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{data.name}</p>
                                  <p style={{ color: data.color || (payload[0] as any).color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                    {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-[#01bfa5]">
                        {formatCurrency(pieDataIncomes.reduce((acc, cur) => acc + cur.value, 0))}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">
                        Total <ChevronDown className="w-3 h-3 inline-block" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                    {t('noIncomes')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'balance-monthly':
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t('monthlyBalance')}</CardTitle>
                <p className={`text-2xl font-bold mt-1 ${monthlyBalance >= 0 ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                  <AnimatedValue value={monthlyBalance} userSettings={userSettings} />
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-h-[256px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis hide />
                    <Tooltip 
                      trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                        borderRadius: '12px', 
                        border: '1px solid #333',
                        padding: '12px'
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ fontWeight: '600' }}
                      formatter={(value: number, name: string, props: any) => {
                        const color = props.payload?.color || props.color;
                        return [
                          <span style={{ color, fontWeight: 'bold' }}>{formatCurrency(value)}</span>,
                          <span style={{ color }}>{name}</span>
                        ];
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      case 'pending-transactions':
        const pending = monthlyTransactions.filter(t => t.status === 'pending');
        return (
          <Card 
            key={id} 
            className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all cursor-pointer"
            onClick={() => navigate('/expenses')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t('pendingTransactions')} ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pending.length > 0 ? (
                  pending.slice(0, 4).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-[#01bfa5]' : 'bg-[#ee5350]'}`} />
                        <span className="text-sm font-medium truncate max-w-[120px]">{t.description}</span>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(t.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-400 text-sm">{t('noPending')}</div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'credit-card':
      case 'tag-expenses': {
        const tagTotals = expensesMonth.reduce((acc, curr) => {
          if (curr.tags && curr.tags.length > 0) {
            curr.tags.forEach(tagId => {
              acc[tagId] = (acc[tagId] || 0) + curr.amount;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        const pieDataTags = Object.entries(tagTotals)
          .map(([tagId, amount]) => {
            const tag = tags.find(t => t.id === tagId);
            return {
              name: tag?.name || 'Desconhecido',
              value: amount,
              color: tag?.color || '#ccc',
            } as { name: string, value: number, color: string };
          })
          .sort((a, b) => b.value - a.value);

        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Despesas por Tags</CardTitle>
              </div>
              <button 
                onClick={() => navigate('/reports', { state: { tab: 'tags' } })}
                className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors tracking-wider"
              >
                Ver mais
              </button>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full min-h-[320px] min-w-0">
                {pieDataTags.length > 0 ? (
                  <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataTags}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieDataTags.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          offset={10}
                          allowEscapeViewBox={{ x: true, y: true }}
                          trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                          content={(props: any) => { const { active, payload, coordinate, viewBox } = props;
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const value = payload[0].value as number;
                              const total = pieDataTags.reduce((acc, cur) => acc + cur.value, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              
                              const vw = viewBox?.width || 300;
                              const vh = viewBox?.height || 280;
                              const cx = viewBox?.cx ?? vw / 2;
                              const cy = viewBox?.cy ?? vh / 2;
                              const coordX = coordinate?.x ?? cx;
                              const coordY = coordinate?.y ?? cy;
                              
                              const isLeft = coordX < cx;
                              const isTop = coordY < cy;
                              
                              const translateX = isLeft 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordX - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vw - 20 - coordX)}px - 100%))`;
                                
                              const translateY = isTop 
                                ? `max(calc(-100% - 20px), -${Math.max(0, coordY - 10)}px)` 
                                : `min(0px, calc(${Math.max(0, vh - 20 - coordY)}px - 100%))`;

                              return (
                                <div style={{
                                  transform: `translate(${translateX}, ${translateY})`,
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                  borderRadius: '12px', 
                                  border: '1px solid #333',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  padding: '12px',
                                  width: 'max-content',
                                  pointerEvents: 'none',
                                  zIndex: 1000
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: data.color }} />
                                    <p style={{ color: '#fff', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{data.name}</p>
                                  </div>
                                  <p style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-[#ee5350]">
                        {formatCurrency(pieDataTags.reduce((acc, cur) => acc + cur.value, 0))}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">
                        Total <ChevronDown className="w-3 h-3 inline-block" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm font-medium">
                    {t('noTransactionsFound')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Global Filter */}
      <div className="flex justify-end mb-2 items-center gap-2">
        {selectedCostCenterId !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedCostCenterId('all')}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            Limpar filtro
          </Button>
        )}
        <Select value={selectedCostCenterId} onValueChange={setSelectedCostCenterId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue>
              {selectedCostCenterId === 'all' 
                ? "Todos os Centros de Custos" 
                : costCenters.find(c => c.id === selectedCostCenterId)?.name || "Todos os Centros de Custos"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Centros de Custos</SelectItem>
            {costCenters.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Header Section */}
      <div 
        className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-2xl transition-colors md:sticky top-0 z-20 bg-background/80 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6"
        onClick={() => navigate('/transactions')}
      >
        <div className="flex items-center gap-4 mb-4" onClick={(e) => e.stopPropagation()}>
          <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div 
            className="text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800/60 rounded-full font-medium text-sm px-6 py-2 min-w-[140px] text-center cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMonthPickerOpen(true);
            }}
          >
            {formattedMonth} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('totalBalance')}</p>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            <AnimatedValue value={totalBalance} userSettings={userSettings} />
          </h1>
        </div>
        
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-xs text-[#01BFA5]">{t('monthBalance')} ({formattedMonth})</p>
          <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-[#01BFA5]' : 'text-[#ee5350]'}`}>
            <AnimatedValue value={monthlyBalance} userSettings={userSettings} />
          </p>
        </div>
      </div>

      {/* Balances Section */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm cursor-pointer hover:bg-secondary transition-all bg-card"
          onClick={() => navigate('/incomes')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#01bfa5]/10 dark:bg-[#01bfa5]/20 flex items-center justify-center text-[#01bfa5]">
              <ArrowUpIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t('incomes')} ({incomeCount})</p>
              <p className="font-semibold text-[#01bfa5]">
                <AnimatedValue value={totalIncome} userSettings={userSettings} />
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm cursor-pointer hover:bg-secondary transition-all bg-card"
          onClick={() => navigate('/expenses')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ee5350]/10 dark:bg-[#ee5350]/20 flex items-center justify-center text-[#ee5350]">
              <ArrowDownIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t('expenses')} ({expenseCount})</p>
              <p className="font-semibold text-[#ee5350]">
                <AnimatedValue value={totalExpense} userSettings={userSettings} />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Splits Summary */}
      {(whoOwesMe > 0 || iOweThem > 0) && (
        <Card 
          className="rounded-2xl border-none shadow-sm bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/splits')}
        >
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Rateios e Dívidas</CardTitle>
                <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Acompanhe quem deve quem</p>
              </div>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
              <div className="text-center sm:text-right">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">A Receber</p>
                <p className="font-bold text-[#01bfa5]"><AnimatedValue value={whoOwesMe} userSettings={userSettings} /></p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">A Pagar</p>
                <p className="font-bold text-[#ee5350]"><AnimatedValue value={iOweThem} userSettings={userSettings} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Region */}
      {activeAlerts.length > 0 && (
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2 text-[#01bfa5] font-semibold">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Alertas Inteligentes (IA)</span>
            </div>
            <ul className="space-y-2">
              {activeAlerts.map((alert, i) => (
                <li key={i} className="text-xs text-red-800 dark:text-red-300 leading-snug">
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {userSettings.dashboard.leftCards
            .filter(id => id !== 'pending-transactions')
            .map(id => renderCard(id))}
        </div>
        <div className="space-y-6">
          {userSettings.dashboard.rightCards
            .filter(id => id !== 'pending-transactions')
            .map(id => renderCard(id))}
        </div>
      </div>

      {/* Footer Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderCard('pending-transactions')}
        </div>
        <div className="space-y-6">
          {achievements.length > 0 && (
            <Card className="rounded-2xl border-none shadow-sm bg-card h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-[#01bfa5] font-semibold">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Suas Conquistas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((ach) => (
                    <div key={ach.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${ach.bg} shadow-sm border border-black/5 dark:border-white/5`}>
                      <Target className="w-3 h-3" />
                      <div>
                        <p className="text-xs font-bold leading-none">{ach.title}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">{ach.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Sheet>
          <SheetTrigger render={
            <Button 
              variant="outline" 
              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 rounded-full"
              onClick={handleGenerateInsights}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('aiInsights')}
            </Button>
          } />
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Insights Financeiros
              </SheetTitle>
              <SheetDescription>
                Análise inteligente dos seus gastos deste mês.
              </SheetDescription>
            </SheetHeader>
            
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-sm text-zinc-500">Analisando suas transações...</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert prose-purple max-w-none">
                <div className="markdown-body">
                  <Markdown>{insights}</Markdown>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <MonthPicker 
        open={isMonthPickerOpen} 
        onOpenChange={setIsMonthPickerOpen} 
        selectedDate={currentDate} 
        onSelect={setCurrentDate} 
      />
    </div>
  );
};
