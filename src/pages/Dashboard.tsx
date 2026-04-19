import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, CreditCardIcon, WalletIcon, Sparkles, Loader2, Eye, EyeOff, Plus, ChevronLeft, ChevronRight, Activity, BellRing, Trophy, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getSpendingInsights } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router';
import { MonthPicker } from '@/components/MonthPicker';
import { useTranslation } from '@/lib/i18n';
import { PrivacyPasswordDialog } from '@/components/PrivacyPasswordDialog';

export const Dashboard = () => {
  const { transactions, categories, userSettings, monthlyPlan } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const incomesMonth = monthlyTransactions.filter(t => t.type === 'income');
  const expensesMonth = monthlyTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomesMonth.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expensesMonth.reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = transactions
    .filter(t => {
      const d = new Date(t.date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth();
      
      if (tYear < currentYear) return true;
      if (tYear === currentYear && tMonth <= currentMonth) return true;
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
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
      const d = new Date(t.date);
      return d.getMonth() === index && d.getFullYear() === currentYear;
    });
    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { name: month, income, expense, balance: income - expense };
  });

  // Data for Pie Chart (Expenses)
  const pieDataExpenses = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = monthlyTransactions
        .filter(t => t.categoryId === c.id)
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: c.name, value: amount, color: c.color };
    })
    .filter(d => d.value > 0);

  // Data for Pie Chart (Incomes)
  const pieDataIncomes = categories
    .filter(c => c.type === 'income')
    .map(c => {
      const amount = monthlyTransactions
        .filter(t => t.categoryId === c.id)
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: c.name, value: amount, color: c.color };
    })
    .filter(d => d.value > 0);

  const handleGenerateInsights = async () => {
    if (insights) return;
    setLoadingInsights(true);
    const result = await getSpendingInsights(monthlyTransactions, categories);
    setInsights(result);
    setLoadingInsights(false);
  };

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(value);
  };

  const renderCard = (id: string) => {
    switch (id) {
      case 'category-expenses':
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('expensesByCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-h-[256px] min-w-0">
                {pieDataExpenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieDataExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
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
                          const total = pieDataExpenses.reduce((acc, cur) => acc + cur.value, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                          const color = props.payload?.color || props.color;
                          return [
                            <span style={{ color }}>{`${formatCurrency(value)} (${percentage}%)`}</span>,
                            <span style={{ color }}>{name}</span>
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
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
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('incomesByCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-h-[256px] min-w-0">
                {pieDataIncomes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataIncomes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieDataIncomes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
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
                          const total = pieDataIncomes.reduce((acc, cur) => acc + cur.value, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                          const color = props.payload?.color || props.color;
                          return [
                            <span style={{ color }}>{`${formatCurrency(value)} (${percentage}%)`}</span>,
                            <span style={{ color }}>{name}</span>
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
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
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('monthlyBalance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-h-[256px] min-w-0">
                {totalIncome > 0 || totalExpense > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
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
                          return [
                            <span style={{ color }}>{formatCurrency(value)}</span>,
                            <span style={{ color }}>{name}</span>
                          ];
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                    Não há transações neste mês.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'pending-transactions':
        const pending = monthlyTransactions.filter(t => t.status === 'pending');
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('pendingTransactions')} ({pending.length})</CardTitle>
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
        return (
          <Card key={id} className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('creditCard')}</CardTitle>
              <CreditCardIcon className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl text-white">
                  <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{t('currentInvoice')}</p>
                  <p className="text-xl font-bold">{formatCurrency(totalExpense * 0.4)}</p>
                  <div className="mt-4 flex justify-between items-end">
                    <p className="text-xs opacity-80">•••• 4582</p>
                    <div className="w-8 h-5 bg-orange-400 rounded-sm opacity-80" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <div 
            className="text-zinc-900 dark:text-white font-semibold text-lg min-w-[120px] text-center cursor-pointer select-none hover:text-[#8B5CF6] transition-colors"
            onClick={() => setIsMonthPickerOpen(true)}
          >
            {formattedMonth} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('totalBalance')}</p>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </h1>
        </div>
        
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-xs text-[#01BFA5]">{t('monthBalance')} ({formattedMonth})</p>
          <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-[#01BFA5]' : 'text-[#ee5350]'}`}>
            {formatCurrency(monthlyBalance)}
          </p>
        </div>
      </div>

      {/* Income / Expense summary */}
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('incomes')} ({incomeCount})</p>
              <p className="font-semibold text-[#01bfa5]">{formatCurrency(totalIncome)}</p>
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('expenses')} ({expenseCount})</p>
              <p className="font-semibold text-[#ee5350]">{formatCurrency(totalExpense)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gamification and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeAlerts.length > 0 && (
          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400 font-semibold">
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

        {achievements.length > 0 && (
          <Card className="rounded-2xl border-none shadow-sm bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 text-secondary-foreground font-semibold">
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

      {/* Dynamic Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {userSettings.dashboard.leftCards.map(id => renderCard(id))}
        </div>
        <div className="space-y-6">
          {userSettings.dashboard.rightCards.map(id => renderCard(id))}
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
