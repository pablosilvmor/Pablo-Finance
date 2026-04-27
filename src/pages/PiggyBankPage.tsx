import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Calculator, Wallet, Coins, TrendingUp, Landmark, Trash2, Edit2, ArrowDownRight, ArrowRightLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { NumericFormat } from 'react-number-format';
import { CalculatorDialog } from '@/components/CalculatorDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, subMonths, isSameMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

export const PiggyBankPage = () => {
  const { 
    piggyBank, updatePiggyBank, bulkUpdatePiggyBank, addPiggyBank, deletePiggyBank, resetPiggyBankBalance, addPiggyBankTransaction, updatePiggyBankDeposit, deletePiggyBankDeposit, piggyBankHistory, userSettings
  } = useAppStore();
  const { t } = useTranslation(userSettings.language);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<'depositAmount' | 'bankBalance' | null>(null);
  const [activeBank, setActiveBank] = useState<string | null>(null);
  const [selectedBankFilter, setSelectedBankFilter] = useState<string | null>(null);

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositBank, setDepositBank] = useState<string>('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankColor, setNewBankColor] = useState('#8B5CF6');
  const [editingDepositIndex, setEditingDepositIndex] = useState<number | null>(null);
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDepositDate, setEditDepositDate] = useState('');
  const [editDepositBank, setEditDepositBank] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    onConfirm: () => {},
  });

  const handleEditDeposit = (index: number) => {
    setEditingDepositIndex(index);
    setEditDepositAmount(piggyBankHistory[index].amount.toString());
    setEditDepositDate(piggyBankHistory[index].date.split('T')[0]);
    setEditDepositBank(piggyBankHistory[index].bank || '');
  };

  const confirmEditDeposit = (index: number) => {
    if (!editDepositBank) {
      toast.error(t('selectBankToast'));
      return;
    }
    const oldEntry = piggyBankHistory[index];
    const newAmount = Number(editDepositAmount);
    
    // Revert old transaction
    if (oldEntry.type === 'deposit' || !oldEntry.type) {
      const bank = piggyBank.find(b => b.bank === oldEntry.bank);
      if (bank) updatePiggyBank(bank.bank, bank.balance - oldEntry.amount);
    } else if (oldEntry.type === 'withdrawal') {
      const bank = piggyBank.find(b => b.bank === oldEntry.bank);
      if (bank) updatePiggyBank(bank.bank, bank.balance + oldEntry.amount);
    } else if (oldEntry.type === 'transfer' && oldEntry.toBank) {
      const fromBank = piggyBank.find(b => b.bank === oldEntry.bank);
      const toBank = piggyBank.find(b => b.bank === oldEntry.toBank);
      if (fromBank) updatePiggyBank(fromBank.bank, fromBank.balance + oldEntry.amount);
      if (toBank) updatePiggyBank(toBank.bank, toBank.balance - oldEntry.amount);
    }

    // Apply new transaction
    if (oldEntry.type === 'deposit' || !oldEntry.type) {
      const bank = piggyBank.find(b => b.bank === editDepositBank);
      if (bank) updatePiggyBank(bank.bank, bank.balance + newAmount);
    } else if (oldEntry.type === 'withdrawal') {
      const bank = piggyBank.find(b => b.bank === editDepositBank);
      if (bank) updatePiggyBank(bank.bank, bank.balance - newAmount);
    } else if (oldEntry.type === 'transfer' && oldEntry.toBank) {
      const fromBank = piggyBank.find(b => b.bank === editDepositBank);
      const toBank = piggyBank.find(b => b.bank === oldEntry.toBank);
      if (fromBank) updatePiggyBank(fromBank.bank, fromBank.balance - newAmount);
      if (toBank) updatePiggyBank(toBank.bank, toBank.balance + newAmount);
    }

    updatePiggyBankDeposit(index, newAmount, new Date(editDepositDate).toISOString(), editDepositBank);
    setEditingDepositIndex(null);
    toast.success(t('depositUpdated'));
  };

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

  const totalPiggyBank = useMemo(() => {
    return piggyBank.reduce((acc, curr) => acc + curr.balance, 0);
  }, [piggyBank]);
  const chartData = useMemo(() => {
    const today = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(today, 5 - i));
    
    return months.map(monthDate => {
      const amount = piggyBankHistory
        .filter(entry => isSameMonth(parseISO(entry.date), monthDate))
        .reduce((acc, curr) => {
          if (curr.type === 'withdrawal') return acc - curr.amount;
          if (curr.type === 'transfer') return acc;
          return acc + curr.amount;
        }, 0);
      
      return {
        month: format(monthDate, 'MMM', { locale: getDateLocale() }),
        amount
      };
    });
  }, [piggyBankHistory]);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('invalidDepositValue'));
      return;
    }
    if (!depositBank) {
      toast.error(t('selectBankToast'));
      return;
    }
    addPiggyBankTransaction(amount, new Date(depositDate).toISOString(), depositBank, 'deposit');
    
    // Update bank balance
    const bank = piggyBank.find(b => b.bank === depositBank);
    if (bank) {
      updatePiggyBank(bank.bank, bank.balance + amount);
    }

    setDepositAmount('');
    setDepositBank('');
    toast.success(t('depositRegistered'));
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('invalidDepositValue'));
      return;
    }
    if (!depositBank) {
      toast.error(t('selectBankToast'));
      return;
    }
    
    const bank = piggyBank.find(b => b.bank === depositBank);
    if (!bank || bank.balance < amount) {
      toast.error('Saldo insuficiente neste banco para realizar o saque.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Saque',
      description: `Confirma o saque de ${formatCurrency(amount)} do banco ${depositBank}?`,
      confirmText: 'CONFIRMAR SAQUE',
      onConfirm: () => {
        addPiggyBankTransaction(amount, new Date(depositDate).toISOString(), depositBank, 'withdrawal');
        updatePiggyBank(bank.bank, bank.balance - amount);
        setDepositAmount('');
        setDepositBank('');
        toast.success('Saque registrado com sucesso!');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido para transferência.');
      return;
    }
    if (!transferFrom || !transferTo) {
      toast.error('Selecione os bancos de origem e destino.');
      return;
    }
    if (transferFrom === transferTo) {
      toast.error('Os bancos de origem e destino devem ser diferentes.');
      return;
    }

    const fromBankObj = piggyBank.find(b => b.bank === transferFrom);
    const toBankObj = piggyBank.find(b => b.bank === transferTo);

    if (!fromBankObj || fromBankObj.balance < amount) {
      toast.error('Saldo insuficiente no banco de origem.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Transferência',
      description: `Deseja transferir ${formatCurrency(amount)} de ${transferFrom} para ${transferTo}?`,
      confirmText: 'CONFIRMAR TRANSFERÊNCIA',
      onConfirm: () => {
        addPiggyBankTransaction(amount, new Date(transferDate).toISOString(), transferFrom, 'transfer', transferTo);
        
        bulkUpdatePiggyBank([
          { bank: fromBankObj.bank, balance: fromBankObj.balance - amount },
          { bank: toBankObj!.bank, balance: toBankObj!.balance + amount }
        ]);

        setTransferAmount('');
        setTransferFrom('');
        setTransferTo('');
        setIsTransferDialogOpen(false);
        toast.success('Transferência registrada com sucesso!');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddBank = () => {
    if (!newBankName.trim()) return;
    addPiggyBank(newBankName, newBankColor);
    setNewBankName('');
    setNewBankColor('#8B5CF6');
    toast.success(t('bankAdded'));
  };

  const handleDeleteBank = (bank: string) => {
    deletePiggyBank(bank);
    toast.success(t('bankDeleted'));
  };

  const [localBalances, setLocalBalances] = useState<Record<string, string>>({});

  // Initialize local balances when piggyBank changes, but only for banks not currently being edited
  useEffect(() => {
    const newLocalBalances = { ...localBalances };
    piggyBank.forEach(item => {
      if (!(item.bank in localBalances)) {
        newLocalBalances[item.bank] = item.balance.toString();
      }
    });
    // We don't want to overwrite if the user is typing, so we only add missing ones
    // Actually, it's better to just keep them in sync when not focused.
  }, [piggyBank]);

  const handleBalanceChange = (bank: string, value: string) => {
    setLocalBalances(prev => ({ ...prev, [bank]: value }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData;
      const total = data.reduce((acc, curr) => acc + (curr.amount > 0 ? curr.amount : 0), 0);
      const value = payload[0].value;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
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
            <span style={{ color: value > 0 ? '#8B5CF6' : '#9ca3af' }} className="font-bold">
              {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const filteredHistory = useMemo(() => {
    if (!selectedBankFilter) return piggyBankHistory;
    return piggyBankHistory.filter(entry => entry.bank === selectedBankFilter);
  }, [piggyBankHistory, selectedBankFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('piggyBank')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 rounded-[2.5rem] border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Coins className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-purple-100 text-sm font-medium">{t('totalSaved')}</p>
                <h2 className="text-3xl font-bold">{formatCurrency(totalPiggyBank)}</h2>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-purple-100 text-xs uppercase font-bold tracking-wider">{t('bank')}</Label>
                <Select value={depositBank} onValueChange={setDepositBank}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
                    <SelectValue placeholder={t('selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {piggyBank.map(bank => (
                      <SelectItem key={bank.bank} value={bank.bank}>{bank.bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-purple-100 text-xs uppercase font-bold tracking-wider">{t('depositDate')}</Label>
                <Input 
                  type="date" 
                  value={depositDate} 
                  onChange={e => setDepositDate(e.target.value)} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-purple-100 text-xs uppercase font-bold tracking-wider">{t('value')}</Label>
                <div className="flex gap-2">
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix={userSettings.currency === 'BRL' ? 'R$ ' : userSettings.currency === 'USD' ? '$ ' : '€ '}
                    decimalScale={2}
                    fixedDecimalScale
                    value={depositAmount}
                    onValueChange={(values) => setDepositAmount(values.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl flex-1"
                    placeholder="0,00"
                  />
                  <Button onClick={() => { setCalculatorTarget('depositAmount'); setIsCalculatorOpen(true); }} variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleDeposit} className="bg-white text-purple-700 hover:bg-purple-50 rounded-xl h-12 font-bold text-sm px-4">
                  DEPÓSITO
                </Button>
                <Button onClick={handleWithdrawal} className="bg-red-500 text-white hover:bg-red-600 rounded-xl h-12 font-bold text-sm px-4">
                  SAQUE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              {t('depositEvolution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis hide />
                  <Tooltip trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'} content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#8B5CF6' : '#3A3A3C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card 
        className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden cursor-default"
        onClick={() => setSelectedBankFilter(null)}
      >
        <CardHeader 
          className="border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Landmark className="w-6 h-6" />
            </div>
            {t('balancesByInstitution')}
          </CardTitle>
          <div className="flex flex-wrap gap-3 items-center">
            <Input 
              value={newBankName}
              onChange={e => setNewBankName(e.target.value)}
              placeholder={t('bankName')}
              className="h-10 w-48 bg-secondary border-border text-foreground rounded-xl"
            />
            <input 
              type="color"
              value={newBankColor}
              onChange={e => setNewBankColor(e.target.value)}
              className="h-10 w-10 rounded-xl bg-secondary border-border cursor-pointer"
            />
            <Button onClick={() => setIsTransferDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 text-white rounded-xl px-6">
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Transferência
            </Button>
            <Button onClick={handleAddBank} className="bg-primary hover:bg-primary/90 h-10 text-primary-foreground rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" /> {t('newBank')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {piggyBank.map((item) => (
              <div 
                key={item.bank} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBankFilter(selectedBankFilter === item.bank ? null : item.bank);
                }}
                  className={`p-6 rounded-3xl border transition-all relative group cursor-pointer ${
                    selectedBankFilter === item.bank 
                      ? 'bg-secondary border-primary shadow-lg shadow-primary/20' 
                      : 'bg-card border-border hover:bg-secondary hover:border-primary/50'
                  }`}
              >
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Zerar"
                    className="h-8 w-8 p-0 text-xs font-bold bg-zinc-800/50 text-zinc-500 hover:text-yellow-500 hover:bg-zinc-700 rounded-lg border border-zinc-700/50 transition-all"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Zerar Saldo',
                        description: `Deseja realmente zerar o saldo do banco ${item.bank}? Esta ação não pode ser desfeita.`,
                        confirmText: 'ZERAR SALDO',
                        onConfirm: () => {
                          resetPiggyBankBalance(item.bank);
                          toast.success(`Saldo do ${item.bank} zerado.`);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }}
                  >
                    <Coins className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-zinc-700 rounded-lg border border-zinc-700/50 transition-all"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Excluir Banco',
                        description: `Deseja realmente excluir o banco ${item.bank}?`,
                        confirmText: 'EXCLUIR BANCO',
                        onConfirm: () => {
                          handleDeleteBank(item.bank);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }}
                    title="Excluir banco"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                      <Wallet className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <input 
                      type="color"
                      value={item.color}
                      onChange={e => { e.stopPropagation(); updatePiggyBank(item.bank, item.balance, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Alterar cor"
                    />
                  </div>
                  <span className="font-bold text-lg text-foreground">{item.bank}</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">{t('currentBalance')}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#00E6B8]">
                      {formatCurrency(item.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card">
        <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">
            {t('depositHistory')} {selectedBankFilter && <span className="text-primary text-sm ml-2">({selectedBankFilter})</span>}
          </CardTitle>
          {selectedBankFilter && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedBankFilter(null)} className="text-muted-foreground hover:text-foreground">
              {t('clearFilter')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('noDepositFound')}</div>
            ) : (
              filteredHistory.map((entry, index) => {
                const originalIndex = piggyBankHistory.findIndex(e => e === entry);
                return (
                  <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-2xl border border-border gap-4">
                    {editingDepositIndex === originalIndex ? (
                      <div className="flex flex-wrap gap-3 items-center w-full">
                        <Select value={editDepositBank} onValueChange={setEditDepositBank}>
                          <SelectTrigger className="w-36 bg-zinc-700 border-zinc-600 text-white rounded-xl">
                            <SelectValue placeholder={t('selectBank')} />
                          </SelectTrigger>
                          <SelectContent>
                            {piggyBank.map(bank => (
                              <SelectItem key={bank.bank} value={bank.bank}>{bank.bank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="date" value={editDepositDate} onChange={e => setEditDepositDate(e.target.value)} className="w-36 bg-zinc-700 border-zinc-600 text-white rounded-xl" />
                        <Input type="number" value={editDepositAmount} onChange={e => setEditDepositAmount(e.target.value)} className="w-28 bg-zinc-700 border-zinc-600 text-white rounded-xl" />
                        <Button variant="ghost" size="icon" onClick={() => confirmEditDeposit(originalIndex)} className="text-green-400 hover:text-green-300 ml-auto">
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.type === 'withdrawal' ? 'bg-red-500/20 text-red-500' : entry.type === 'transfer' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>
                            {entry.type === 'withdrawal' ? <ArrowDownRight className="w-5 h-5" /> : entry.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="text-foreground font-medium block">{format(parseISO(entry.date), 'dd/MM/yyyy')}</span>
                            <span className="text-xs text-muted-foreground">
                              {entry.type === 'withdrawal' ? `Saque de ${entry.bank}` : entry.type === 'transfer' ? `Transferência de ${entry.bank} para ${entry.toBank}` : `Depósito em ${entry.bank}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <span className={`font-bold text-lg ${entry.type === 'withdrawal' ? 'text-red-500' : entry.type === 'transfer' ? 'text-blue-500' : 'text-[#00E6B8]'}`}>
                            {entry.type === 'withdrawal' ? '-' : entry.type === 'transfer' ? '' : '+'}{formatCurrency(entry.amount)}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditDeposit(originalIndex)} className="text-blue-400 hover:text-blue-300">
                              <Edit2 className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deletePiggyBankDeposit(originalIndex)} className="text-red-500 hover:text-red-400">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Transferência entre Bancos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>De (Origem)</Label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o banco de origem" />
                </SelectTrigger>
                <SelectContent>
                  {piggyBank.map(bank => (
                    <SelectItem key={bank.bank} value={bank.bank}>{bank.bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para (Destino)</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o banco de destino" />
                </SelectTrigger>
                <SelectContent>
                  {piggyBank.map(bank => (
                    <SelectItem key={bank.bank} value={bank.bank}>{bank.bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={transferDate} 
                onChange={e => setTransferDate(e.target.value)} 
                className="bg-secondary border-border [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <NumericFormat
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix={userSettings.currency === 'BRL' ? 'R$ ' : userSettings.currency === 'USD' ? '$ ' : '€ '}
                decimalScale={2}
                fixedDecimalScale
                value={transferAmount}
                onValueChange={(values) => setTransferAmount(values.value)}
                className="bg-secondary border-border"
                placeholder="0,00"
              />
            </div>
            <Button onClick={handleTransfer} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Confirmar Transferência
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button onClick={confirmDialog.onConfirm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {confirmDialog.confirmText || 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CalculatorDialog 
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        initialValue={
          calculatorTarget === 'depositAmount' ? (Number(depositAmount) || 0) :
          calculatorTarget === 'bankBalance' ? (piggyBank.find(b => b.bank === activeBank)?.balance || 0) : 0
        }
        onConfirm={(val) => {
          if (calculatorTarget === 'depositAmount') setDepositAmount(val.toString());
          else if (calculatorTarget === 'bankBalance' && activeBank) updatePiggyBank(activeBank, val);
        }}
      />
    </div>
  );
};
