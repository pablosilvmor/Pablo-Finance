import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Target, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft, ChevronRight, ChevronLeft, Search, Info, Settings, Tag, ChevronDown, DollarSign, Home, Sparkles, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { NumericFormat } from 'react-number-format';
import { CalculatorDialog } from '@/components/CalculatorDialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { MonthPicker } from '@/components/MonthPicker';
import { format, isSameMonth, parseISO, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryBadge } from '@/components/CategoryBadge';

export const Planning = () => {
  const navigate = useNavigate();
  const { categories, monthlyPlan, updateMonthlyPlan, activeTransactions: transactions, userSettings } = useAppStore();
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [step, setStep] = useState(1);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcTarget, setCalcTarget] = useState<'income' | 'budget' | null>(null);
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [isTableSearchOpen, setIsTableSearchOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const savingsAmount = (monthlyPlan.income * monthlyPlan.savingsPercentage) / 100;
  const budgetTotal = monthlyPlan.income - savingsAmount;
  
  const categorizedTotal = monthlyPlan.budgets.reduce((sum, b) => sum + b.limit, 0);
  const remainingBudget = budgetTotal - categorizedTotal;

  const handleUpdateBudget = (categoryId: string, limit: number) => {
    const existing = monthlyPlan.budgets.find(b => b.categoryId === categoryId);
    const previousLimit = existing?.limit || 0;

    if (existing) {
      updateMonthlyPlan({
        budgets: monthlyPlan.budgets.map(b => b.categoryId === categoryId ? { ...b, limit } : b)
      });
    } else {
      updateMonthlyPlan({
        budgets: [...monthlyPlan.budgets, { categoryId, limit }]
      });
    }

    toast.success('Orçamento atualizado', {
      action: {
        label: 'Desfazer',
        onClick: () => {
          if (existing) {
            updateMonthlyPlan({
              budgets: monthlyPlan.budgets.map(b => b.categoryId === categoryId ? { ...b, limit: previousLimit } : b)
            });
          } else {
            updateMonthlyPlan({
              budgets: monthlyPlan.budgets.filter(b => b.categoryId !== categoryId)
            });
          }
        }
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    const exists = monthlyPlan.budgets.find(b => b.categoryId === categoryId);
    const previousBudgets = [...monthlyPlan.budgets];

    if (exists) {
      updateMonthlyPlan({
        budgets: monthlyPlan.budgets.filter(b => b.categoryId !== categoryId)
      });
      toast.success('Categoria removida do planejamento', {
        action: {
          label: 'Desfazer',
          onClick: () => updateMonthlyPlan({ budgets: previousBudgets })
        }
      });
    } else {
      updateMonthlyPlan({
        budgets: [...monthlyPlan.budgets, { categoryId, limit: 0 }]
      });
      toast.success('Categoria adicionada ao planejamento', {
        action: {
          label: 'Desfazer',
          onClick: () => updateMonthlyPlan({ budgets: previousBudgets })
        }
      });
    }
  };

  const filteredCategories = categories
    .filter(c => c.type === 'expense')
    .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedDate));
  }, [transactions, selectedDate]);

  const getDateLocale = () => {
    switch (userSettings.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
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

  const calculateProgress = (spent: number, limit: number) => {
    if (limit === 0) return spent > 0 ? 100 : 0;
    return Math.min(100, (spent / limit) * 100);
  };

  if (viewMode === 'view') {
    const totalSpentPaid = currentMonthTransactions.filter(t => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
    const totalSpentPending = currentMonthTransactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
    const totalSpent = totalSpentPaid + totalSpentPending;
    const totalRemaining = budgetTotal - totalSpent;
    
    const daysInMonth = differenceInDays(endOfMonth(selectedDate), selectedDate) + 1;
    const availablePerDay = totalRemaining > 0 ? totalRemaining / daysInMonth : 0;
    
    const totalProgress = calculateProgress(totalSpent, budgetTotal);
    const totalPaidProgress = calculateProgress(totalSpentPaid, budgetTotal);
    const totalPendingProgress = calculateProgress(totalSpentPending, budgetTotal);

    const otherCategoriesSpent = currentMonthTransactions
      .filter(t => !monthlyPlan.budgets.find(b => b.categoryId === t.categoryId))
      .reduce((acc, t) => acc + t.amount, 0);
    
    const otherCategoriesPaid = currentMonthTransactions
      .filter(t => !monthlyPlan.budgets.find(b => b.categoryId === t.categoryId) && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
      
    const otherCategoriesPending = currentMonthTransactions
      .filter(t => !monthlyPlan.budgets.find(b => b.categoryId === t.categoryId) && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = transactions.filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedDate)).reduce((acc, t) => acc + t.amount, 0);
    const plannedBalance = totalIncome - budgetTotal;

    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-secondary text-foreground rounded-full px-6 py-2 text-sm font-medium flex items-center cursor-default">
              Planejamento Mensal
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-card p-1 rounded-full border border-border self-center">
            <Button variant="ghost" size="icon" onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }} className="rounded-full h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span 
              className="text-sm font-semibold min-w-[120px] text-center capitalize cursor-pointer select-none hover:text-primary transition-colors"
              onClick={() => setIsMonthPickerOpen(true)}
            >
              {format(selectedDate, 'MMMM yyyy', { locale: getDateLocale() })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }} className="rounded-full h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-border text-primary hover:bg-secondary" onClick={() => { setViewMode('edit'); setStep(1); }}>
              <Plus className="w-4 h-4 mr-2" />
              NOVO ORÇAMENTO
            </Button>
            <div className="flex items-center">
              <AnimatePresence>
                {isTableSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 192, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mr-1"
                  >
                    <div className="relative w-48">
                      <Input 
                        placeholder="Buscar categoria..." 
                        className="w-full h-9 rounded-full bg-card border-border pr-8"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        autoFocus
                      />
                      {tableSearch && (
                        <button 
                          onClick={() => setTableSearch('')} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("rounded-full transition-colors", isTableSearchOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setIsTableSearchOpen(!isTableSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  window.print();
                }}>
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    updateMonthlyPlan({ budgets: [], income: 0, savingsPercentage: 0 });
                    toast.success('Planejamento resetado com sucesso');
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Resetar Planejamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {monthlyPlan.income === 0 && monthlyPlan.budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-card rounded-3xl p-16 mt-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 mx-auto">
              <Target className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Nenhum planejamento definido</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Você ainda não definiu um planejamento para este mês. Configure sua renda e crie seu orçamento mensal.
            </p>
            <Button onClick={() => { setViewMode('edit'); setStep(1); }} className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground mx-auto">
              <Plus className="w-5 h-5 mr-2" />
              Criar Planejamento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-card border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                {/* Total Progress */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Restam</p>
                    <h2 className="text-2xl font-bold text-foreground">
                      {formatCurrency(totalRemaining)}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(totalSpent)} de {formatCurrency(budgetTotal)} gastos
                    </p>
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-end gap-2 mb-1 text-xs text-muted-foreground">
                      <span>{totalProgress.toFixed(2)}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-500" style={{ width: `${totalPaidProgress}%` }} />
                      <div className="h-full bg-green-300" style={{ width: `${totalPendingProgress}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>{totalPaidProgress.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-300" />
                        <span>{totalPendingProgress.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                      <MoreVertical className="w-5 h-5 cursor-pointer" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        updateMonthlyPlan({ budgets: [], income: 0, savingsPercentage: 0 });
                        toast.success('Todos os planejamentos excluídos');
                      }} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir todos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Categoria</th>
                        <th className="pb-3 font-medium">Meta planejada</th>
                        <th className="pb-3 font-medium">Despesas pagas</th>
                        <th className="pb-3 font-medium">Despesas previstas</th>
                        <th className="pb-3 font-medium">Total gasto</th>
                        <th className="pb-3 font-medium"></th>
                        <th className="pb-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {monthlyPlan.budgets
                        .filter(budget => {
                          const category = categories.find(c => c.id === budget.categoryId);
                          return category?.name.toLowerCase().includes(tableSearch.toLowerCase());
                        })
                        .map(budget => {
                          const category = categories.find(c => c.id === budget.categoryId);
                        if (!category) return null;
                        
                        const catTransactions = currentMonthTransactions.filter(t => t.categoryId === budget.categoryId);
                        const catSpentPaid = catTransactions.filter(t => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
                        const catSpentPending = catTransactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
                        const catSpent = catSpentPaid + catSpentPending;
                        const catRemaining = budget.limit - catSpent;
                        
                        const catProgress = calculateProgress(catSpent, budget.limit);
                        const catPaidProgress = calculateProgress(catSpentPaid, budget.limit);
                        const catPendingProgress = calculateProgress(catSpentPending, budget.limit);

                        return (
                          <tr key={budget.categoryId} className="text-foreground">
                            <td className="py-4">
                              <CategoryBadge 
                                category={category} 
                                circleClassName="w-8 h-8"
                                iconClassName="w-4 h-4 text-white"
                                textClassName="text-foreground"
                              />
                            </td>
                            <td className="py-4">{formatCurrency(budget.limit)}</td>
                            <td className="py-4">{formatCurrency(catSpentPaid)}</td>
                            <td className="py-4">{formatCurrency(catSpentPending)}</td>
                            <td className="py-4">{formatCurrency(catSpent)}</td>
                            <td className="py-4 w-48">
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Restam <span className="font-semibold text-foreground">{formatCurrency(catRemaining)}</span></span>
                                  <span className="text-muted-foreground">{catProgress.toFixed(2)}%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                                  <div className="h-full bg-green-500" style={{ width: `${catPaidProgress}%` }} />
                                  <div className="h-full bg-green-300" style={{ width: `${catPendingProgress}%` }} />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span>{catPaidProgress.toFixed(2)}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
                                    <span>{catPendingProgress.toFixed(2)}%</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                                  <Settings className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewMode('edit')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    updateMonthlyPlan({
                                      budgets: monthlyPlan.budgets.filter(b => b.categoryId !== budget.categoryId)
                                    });
                                    toast.success('Planejamento excluído');
                                  }} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Other Categories Row */}
                      {otherCategoriesSpent > 0 && (
                        <tr className="text-foreground">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span>Categorias restantes</span>
                            </div>
                          </td>
                          <td className="py-4">{formatCurrency(0)}</td>
                          <td className="py-4">{formatCurrency(otherCategoriesPaid)}</td>
                          <td className="py-4">{formatCurrency(otherCategoriesPending)}</td>
                          <td className="py-4">{formatCurrency(otherCategoriesSpent)}</td>
                          <td className="py-4 w-48">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Restam <span className="font-semibold text-red-500">-{formatCurrency(otherCategoriesSpent)}</span></span>
                                <span className="text-muted-foreground">100%</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                                <div className="h-full bg-red-500 w-full" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Despesas pagas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-300" />
                    <span>Despesas previstas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Despesas pagas excedentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-300" />
                    <span>Despesas previstas excedentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side Cards */}
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm rounded-3xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receitas do mês</p>
                  <h3 className="text-xl font-bold text-foreground">{formatCurrency(totalIncome)}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-sm rounded-3xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gastos planejados</p>
                  <h3 className="text-xl font-bold text-foreground">{formatCurrency(budgetTotal)}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <TrendingUp className="w-6 h-6 transform rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-sm rounded-3xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Balanço planejado</p>
                  <h3 className="text-xl font-bold text-foreground">{formatCurrency(plannedBalance)}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Target className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-sm rounded-3xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Economia planejada</p>
                  <h3 className="text-xl font-bold text-foreground">{monthlyPlan.savingsPercentage}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Home className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none shadow-lg rounded-3xl text-white overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-200" />
                    <h3 className="font-bold">Dicas da IA</h3>
                  </div>
                  <p className="text-sm text-purple-100 leading-relaxed mb-4">
                    Com base no seu planejamento, você pode economizar até 15% a mais se reduzir gastos na categoria "Lazer".
                  </p>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 border-none text-white rounded-xl">
                    Ver análise completa
                  </Button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        <MonthPicker 
          open={isMonthPickerOpen} 
          onOpenChange={setIsMonthPickerOpen} 
          selectedDate={selectedDate} 
          onSelect={setSelectedDate} 
        />
      </div>
    );
  }

  if (step === 1) {

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('view')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Criação do planejamento mensal</h1>
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Renda mensal</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Quanto você ganha por mês?</Label>
                <div 
                  className="text-3xl font-bold text-primary cursor-pointer border-b-2 border-border pb-2 hover:border-primary transition-colors"
                  onClick={() => {
                    setCalcTarget('income');
                    setIsCalculatorOpen(true);
                  }}
                >
                  R$ {monthlyPlan.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold">E quanto você quer economizar por mês?</Label>
                <p className="text-sm text-muted-foreground">Essa porcentagem será utilizada para calcular seu orçamento mensal de gastos.</p>
                <div className="flex items-end gap-3">
                  <div className="w-24 border-b-2 border-border pb-2">
                    <Input 
                      type="number" 
                      value={monthlyPlan.savingsPercentage} 
                      onChange={e => updateMonthlyPlan({ savingsPercentage: Number(e.target.value) })}
                      className="text-3xl font-bold text-primary bg-transparent border-none p-0 focus-visible:ring-0 h-auto"
                    />
                  </div>
                  <span className="text-2xl font-bold text-primary pb-2">%</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-secondary border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-muted-foreground text-sm">Seu orçamento mensal de gastos será:</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(budgetTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">E você economizará mensalmente:</p>
                  <p className="text-2xl font-bold text-[#01bfa5]">
                    {formatCurrency(savingsAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-8 right-8">
          <Button 
            onClick={() => setStep(2)}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          >
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </Button>
        </div>

        <CalculatorDialog 
          open={isCalculatorOpen}
          onOpenChange={setIsCalculatorOpen}
          initialValue={monthlyPlan.income}
          onConfirm={(val) => updateMonthlyPlan({ income: val })}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Criação do planejamento mensal</h1>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Renda mensal</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Categorização de gastos</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Hora de planejar!</h2>
            <p className="text-muted-foreground">Preencha os campos abaixo com seus limites de gastos para cada categoria.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Categorias</h3>
            <div className="space-y-3">
              {monthlyPlan.budgets.map(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                if (!category) return null;
                return (
                  <Card key={budget.categoryId} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          <Tag className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                        <div 
                          className="text-lg font-bold text-primary cursor-pointer"
                          onClick={() => {
                            setActiveBudgetId(budget.categoryId);
                            setIsCalculatorOpen(true);
                          }}
                        >
                          {formatCurrency(budget.limit)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-none shadow-sm rounded-3xl p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-secondary"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={226}
                    strokeDashoffset={226 - (226 * Math.min(1, categorizedTotal / budgetTotal))}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {Math.round((categorizedTotal / budgetTotal) * 100)}%
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total categorizado</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(categorizedTotal)}</p>
                <p className={cn("text-xs mt-1", remainingBudget >= 0 ? "text-muted-foreground" : "text-red-500")}>
                  {formatCurrency(Math.abs(remainingBudget))} {remainingBudget >= 0 ? "sem categorização" : "ultrapassados"}
                </p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary leading-relaxed">
                <b>Dica:</b> Para remover ou adicionar categorias ao seu planejamento mensal, clique em “Gerenciar categorias”.
              </p>
            </div>

            <Button 
              variant="ghost" 
              className="w-full mt-6 text-primary font-bold uppercase text-xs tracking-widest hover:bg-primary/10"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Gerenciar categorias
            </Button>
          </Card>
        </div>
      </div>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground rounded-3xl p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Quais categorias você gostaria de ter no seu planejamento?</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome" 
                  className="pl-10 pr-8 bg-transparent border-border focus-visible:ring-primary"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                />
                {categorySearch && (
                  <button 
                    onClick={() => setCategorySearch('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-border">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between group cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <Checkbox 
                    checked={!!monthlyPlan.budgets.find(b => b.categoryId === cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                    className="w-6 h-6 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-8 right-8 flex gap-4">
        <Button 
          variant="outline"
          onClick={() => setStep(1)}
          className="w-14 h-14 rounded-full bg-card border-border shadow-lg"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </Button>
        <Button 
          onClick={() => {
            if (categorizedTotal > budgetTotal) {
              toast.warning('Seu planejamento ultrapassa o orçamento disponível.');
            }
            setViewMode('view');
            toast.success('Planejamento concluído com sucesso!');
          }}
          className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 font-bold text-primary-foreground"
        >
          CONCLUIR
        </Button>
      </div>

      <CalculatorDialog 
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        initialValue={activeBudgetId ? (monthlyPlan.budgets.find(b => b.categoryId === activeBudgetId)?.limit || 0) : 0}
        onConfirm={(val) => {
          if (activeBudgetId) {
            handleUpdateBudget(activeBudgetId, val);
            setActiveBudgetId(null);
          }
        }}
      />
    </div>
  );
};
