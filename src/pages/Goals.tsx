import React, { useState, useMemo } from 'react';
import { Target, Plus, ArrowLeft, ChevronRight, Home, Car, Plane, Shield, Briefcase, HelpCircle, Trash2, Edit2, Calculator, Wallet, Coins, TrendingUp, Landmark, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { NumericFormat } from 'react-number-format';
import { CalculatorDialog } from '@/components/CalculatorDialog';
import { GoalDetailDialog } from '@/components/GoalDetailDialog';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, subMonths, isSameMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

export const GOAL_TYPES = [
  { id: 'emergency', name: 'Reserva de emergência', icon: Shield, color: '#01bfa5' },
  { id: 'travel', name: 'Viagem', icon: Plane, color: '#3b82f6' },
  { id: 'car', name: 'Comprar um carro', icon: Car, color: '#f59e0b' },
  { id: 'house', name: 'Comprar uma casa', icon: Home, color: '#ef4444' },
  { id: 'retirement', name: 'Aposentadoria', icon: Briefcase, color: '#8b5cf6' },
  { id: 'other', name: 'Outro', icon: HelpCircle, color: '#6b7280' },
];

export const Goals = () => {
  const { 
    goals, addGoal, updateGoal, deleteGoal, 
    piggyBank, updatePiggyBank, addPiggyBank, deletePiggyBank, addPiggyBankTransaction, updatePiggyBankDeposit, deletePiggyBankDeposit, piggyBankHistory, userSettings
  } = useAppStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<typeof GOAL_TYPES[0] | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<'newTarget' | 'progressValue' | 'depositAmount' | 'bankBalance'>('newTarget');
  const [activeBank, setActiveBank] = useState<string | null>(null);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<any>(null);

  // Cofrinho state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBankName, setNewBankName] = useState('');
  const [editingDepositIndex, setEditingDepositIndex] = useState<number | null>(null);
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDepositDate, setEditDepositDate] = useState('');

  const getDateLocale = () => {
    switch (userSettings.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(value);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget || !newDeadline) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const targetAmount = Number(newTarget.replace(',', '.'));

    if (editingGoalId) {
      updateGoal(editingGoalId, {
        name: newName,
        targetAmount,
        deadline: new Date(newDeadline).toISOString(),
        color: selectedType?.color || '#8B5CF6',
        icon: selectedType?.id || 'target'
      });
      toast.success('Objetivo atualizado com sucesso!');
    } else {
      addGoal({
        name: newName,
        targetAmount,
        currentAmount: 0,
        deadline: new Date(newDeadline).toISOString(),
        color: selectedType?.color || '#8B5CF6',
        icon: selectedType?.id || 'target'
      });
      toast.success('Objetivo criado com sucesso!');
    }

    resetForm();
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoalId(goal.id);
    setNewName(goal.name);
    setNewTarget(goal.targetAmount.toString());
    setNewDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
    setSelectedType(GOAL_TYPES.find(t => t.id === goal.icon) || GOAL_TYPES[GOAL_TYPES.length - 1]);
    setStep(2);
    setIsAddOpen(true);
  };

  const handleUpdateProgress = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    setSelectedGoalId(goalId);
    setProgressValue(goal.currentAmount.toString());
    setIsUpdateProgressOpen(true);
  };

  const confirmUpdateProgress = () => {
    if (selectedGoalId) {
      updateGoal(selectedGoalId, { currentAmount: Number(progressValue) });
      setIsUpdateProgressOpen(false);
      setSelectedGoalId(null);
      toast.success('Progresso atualizado!');
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewTarget('');
    setNewDeadline('');
    setSelectedType(null);
    setStep(1);
    setIsAddOpen(false);
    setEditingGoalId(null);
  };

  const handleSelectType = (type: typeof GOAL_TYPES[0]) => {
    setSelectedType(type);
    setNewName(type.name);
    setStep(2);
  };

  const ongoingGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);

  const handleDeleteGoal = (id: string) => {
    const goalToDelete = goals.find(g => g.id === id);
    if (!goalToDelete) return;

    deleteGoal(id);
    toast.success('Objetivo excluído', {
      action: {
        label: 'Desfazer',
        onClick: () => addGoal(goalToDelete)
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Objetivos</h1>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Objetivo
        </Button>
      </div>

      <Tabs defaultValue="ongoing" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 rounded-full p-1 h-12 w-full max-w-lg">
            <TabsTrigger 
              value="ongoing" 
              className="rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white flex-1 h-10"
            >
              Em Andamento
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white flex-1 h-10"
            >
              Concluídos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ongoing">
          {ongoingGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-48 h-48 mb-8 relative">
                <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 rounded-full animate-pulse" />
                <Target className="w-24 h-24 text-purple-600 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2">Definindo objetivos você alcança seus sonhos mais rápido!</h3>
              <p className="text-zinc-500 mb-8">Que tal criar um pra te ajudar?</p>
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12"
              >
                Criar novo objetivo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingGoals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const Icon = GOAL_TYPES.find(t => t.id === goal.icon)?.icon || Target;
                return (
                  <Card key={goal.id} className="bg-[#2C2C2E] border-none shadow-sm rounded-3xl overflow-hidden group cursor-pointer" onClick={() => { setSelectedGoalForDetail(goal); setIsDetailOpen(true); }}>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                            style={{ backgroundColor: goal.color }}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white">{goal.name}</h3>
                            <p className="text-sm text-zinc-400">
                              Meta: {formatCurrency(goal.targetAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-purple-400" onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2" onClick={(e) => { e.stopPropagation(); handleUpdateProgress(goal.id); }}>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Progresso</span>
                          <span className="font-bold text-white">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, progress)}%`,
                              backgroundColor: goal.color 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400 pt-1">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedGoals.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              Nenhum objetivo concluído ainda. Continue economizando!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map(goal => {
                const Icon = GOAL_TYPES.find(t => t.id === goal.icon)?.icon || Target;
                return (
                  <Card key={goal.id} className="bg-[#2C2C2E] border-none shadow-sm rounded-3xl overflow-hidden opacity-80">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-zinc-700"
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-white">{goal.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-sm text-zinc-500 line-through">{formatCurrency(goal.targetAmount)}</p>
                            <div className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                              <Trophy className="w-3 h-3" />
                              Conquista Desbloqueada
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500" onClick={() => handleDeleteGoal(goal.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAddOpen(open);
      }}>
        <DialogContent className="sm:max-w-[480px] bg-white dark:bg-[#1C1C1E] border-none rounded-3xl p-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Qual o seu objetivo?</h2>
                  <p className="text-zinc-500">Escolha uma das opções abaixo para começar.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {GOAL_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 shadow-lg"
                        style={{ backgroundColor: type.color }}
                      >
                        <type.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-center">{type.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-bold">Detalhes do objetivo</h2>
                </div>

                <form onSubmit={handleAddGoal} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Nome do objetivo</Label>
                    <Input 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      required 
                      className="text-lg font-medium border-zinc-200 dark:border-zinc-800 focus-visible:ring-purple-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Quanto você precisa?</Label>
                    <div 
                      className="text-3xl font-bold text-purple-600 cursor-pointer border-b-2 border-zinc-200 dark:border-zinc-800 pb-2 hover:border-purple-500 transition-colors"
                      onClick={() => setIsCalculatorOpen(true)}
                    >
                      {formatCurrency(Number(newTarget) || 0)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Quando pretende alcançar?</Label>
                    <Input 
                      type="date" 
                      value={newDeadline} 
                      onChange={e => setNewDeadline(e.target.value)} 
                      required 
                      className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-purple-600"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30">
                    CRIAR OBJETIVO
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <CalculatorDialog 
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        initialValue={
          calculatorTarget === 'newTarget' ? (Number(newTarget) || 0) :
          calculatorTarget === 'progressValue' ? (Number(progressValue) || 0) :
          calculatorTarget === 'depositAmount' ? (Number(depositAmount) || 0) :
          calculatorTarget === 'bankBalance' ? (piggyBank.find(b => b.bank === activeBank)?.balance || 0) : 0
        }
        onConfirm={(val) => {
          if (calculatorTarget === 'newTarget') setNewTarget(val.toString());
          else if (calculatorTarget === 'progressValue') setProgressValue(val.toString());
          else if (calculatorTarget === 'depositAmount') setDepositAmount(val.toString());
          else if (calculatorTarget === 'bankBalance' && activeBank) updatePiggyBank(activeBank, val);
        }}
      />

      <Dialog open={isUpdateProgressOpen} onOpenChange={setIsUpdateProgressOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Progresso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quanto você já economizou para este objetivo?</Label>
              <div className="flex gap-2">
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  value={progressValue}
                  onValueChange={(values) => setProgressValue(values.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => setIsCalculatorOpen(true)}>
                  <Calculator className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={confirmUpdateProgress} className="w-full bg-purple-600 hover:bg-purple-700">
              Salvar Progresso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <GoalDetailDialog 
        goal={selectedGoalForDetail}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        goalTypes={GOAL_TYPES}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        onOpenCalculator={() => {
          setCalculatorTarget('depositAmount');
          setIsCalculatorOpen(true);
        }}
        onUpdateGoal={(updates) => {
          if (selectedGoalForDetail) {
            updateGoal(selectedGoalForDetail.id, updates);
            setSelectedGoalForDetail({ ...selectedGoalForDetail, ...updates });
          }
        }}
        onAddDeposit={(amount, date) => {
          if (selectedGoalForDetail) {
            const newDeposits = [...(selectedGoalForDetail.deposits || []), { amount, date }];
            updateGoal(selectedGoalForDetail.id, {
              deposits: newDeposits,
              currentAmount: selectedGoalForDetail.currentAmount + amount
            });
            setSelectedGoalForDetail({
              ...selectedGoalForDetail,
              deposits: newDeposits,
              currentAmount: selectedGoalForDetail.currentAmount + amount
            });
            toast.success('Depósito adicionado!');
          }
        }}
        onDeleteDeposit={(index) => {
          if (selectedGoalForDetail) {
            const newDeposits = [...selectedGoalForDetail.deposits];
            const deletedDeposit = newDeposits.splice(index, 1)[0];
            updateGoal(selectedGoalForDetail.id, {
              deposits: newDeposits,
              currentAmount: selectedGoalForDetail.currentAmount - deletedDeposit.amount
            });
            setSelectedGoalForDetail({
              ...selectedGoalForDetail,
              deposits: newDeposits,
              currentAmount: selectedGoalForDetail.currentAmount - deletedDeposit.amount
            });
            toast.success('Depósito removido!');
          }
        }}
      />
    </div>
  );
};
