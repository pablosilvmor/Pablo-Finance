import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreVertical, Plus, Trash2, Edit2, Calculator } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GoalDetailDialogProps {
  goal: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeposit: (amount: number, date: string) => void;
  onDeleteDeposit: (index: number) => void;
  onOpenCalculator: () => void;
  onUpdateGoal: (updates: any) => void;
  goalTypes: any[];
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
}

export const GoalDetailDialog: React.FC<GoalDetailDialogProps> = ({ goal, open, onOpenChange, onAddDeposit, onDeleteDeposit, onOpenCalculator, onUpdateGoal, goalTypes, depositAmount, setDepositAmount }) => {
  const { userSettings } = useAppStore();
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  if (!goal) return null;

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(value);
  };

  const handleAddDeposit = () => {
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    onAddDeposit(amount, depositDate);
    setDepositAmount('');
    toast.success('Depósito adicionado!');
  };

  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  // Prepare chart data
  const chartData = (goal.deposits || []).reduce((acc: any[], deposit: any) => {
    const month = new Date(deposit.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += deposit.amount;
    } else {
      acc.push({ month, amount: deposit.amount });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const totalDeposited = (goal.deposits || []).reduce((acc: number, d: any) => acc + d.amount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = totalDeposited > 0 ? ((value / totalDeposited) * 100).toFixed(1) : '0.0';
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '12px',
          border: '1px solid #333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          padding: '12px',
        }}>
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-sm">
            <span className="text-gray-400">Quantia : </span>
            <span className="font-bold text-[#8b5cf6]">
              {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-[#1C1C1E] text-white border-none rounded-3xl p-6">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-2xl font-bold">{goal.name}</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-zinc-400 hover:text-white">
              Opções <MoreVertical className="w-4 h-4 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2C2C2E] border-none text-white">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Pausar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem>Marcar como concluído</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Apagar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <div className="bg-[#2C2C2E] p-6 rounded-3xl flex flex-col items-center justify-center relative">
              <h3 className="text-xl font-bold mb-6">{goal.name}</h3>
              
              <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-zinc-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-purple-600 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{progress.toFixed(0)}%</span>
                </div>
              </div>

              <div className="text-sm text-zinc-400 text-center space-y-1">
                <p>Progresso: <span className="font-bold text-white">{formatCurrency(goal.currentAmount)}</span> de {formatCurrency(goal.targetAmount)}</p>
                <p>Restam: <span className="font-bold text-purple-400">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span></p>
              </div>
            </div>

            <div className="bg-[#2C2C2E] p-6 rounded-3xl">
              <h3 className="text-lg font-bold mb-4">Evolução dos Depósitos</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={(value) => formatCurrency(value).replace(/[^0-9]/g, '')} />
                    <Tooltip trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'} content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-[#2C2C2E] p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Depósitos</h3>
              <div className="text-sm text-zinc-400">
                Total: <span className="font-bold text-white">{formatCurrency(totalDeposited)}</span>
              </div>
              <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full" onClick={handleAddDeposit}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 mb-4">
              {goalTypes.map(type => (
                <button key={type.id} onClick={() => onUpdateGoal({ icon: type.id })} className={`p-2 rounded-full ${goal.icon === type.id ? 'bg-zinc-700' : 'bg-[#1C1C1E]'}`}>
                  <type.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  value={depositAmount}
                  onValueChange={(values) => setDepositAmount(values.value)}
                  placeholder="Valor"
                  className="bg-[#1C1C1E] border-none"
                />
                <Button variant="ghost" size="icon" className="text-zinc-400" onClick={onOpenCalculator}>
                  <Calculator className="w-5 h-5" />
                </Button>
              </div>
              <Input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="bg-[#1C1C1E] border-none" />
            </div>
            <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto">
              {goal.deposits?.map((deposit: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-[#1C1C1E] p-3 rounded-xl">
                  <span className="text-sm text-zinc-400">{new Date(deposit.date).toLocaleDateString('pt-BR')}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-500">{formatCurrency(deposit.amount)}</span>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500" onClick={() => onDeleteDeposit(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
