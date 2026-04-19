import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MoreVertical, Search, Filter, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, X, Trash2, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NewTransactionDialog } from '@/components/NewTransactionDialog';
import { MonthPicker } from '@/components/MonthPicker';
import { TransactionMenuOverlay } from '@/components/TransactionMenuOverlay';
import { ImportCsvDialog } from '@/components/ImportCsvDialog';
import { useTranslation } from '@/lib/i18n';

export const Transactions = () => {
  const { transactions, categories, deleteTransaction, bulkDeleteTransactions, updateTransaction, userSettings } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'expense' | 'income'>('expense');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { openNew?: boolean; date?: string } | null;
    if (state?.openNew) {
      setIsMenuOpen(true);
    }
  }, [location.state]);

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const handleMenuSelect = (type: 'expense' | 'income') => {
    setIsMenuOpen(false);
    setNewTransactionType(type);
    setIsNewDialogOpen(true);
  };

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(parseISO(t.date), selectedDate));
  }, [transactions, selectedDate]);

  const filteredTransactions = currentMonthTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const transaction = transactions.find(t => t.id === id);
    if (transaction?.isFixed) {
      setTransactionToDelete(transaction);
    } else {
      deleteTransaction(id);
      toast.success(t('transactionDeleted'));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'];
    const rows = filteredTransactions.map(t => {
      const cat = getCategory(t.categoryId);
      const type = t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência');
      const status = t.status === 'paid' ? 'Pago' : 'Pendente';
      return [
        format(parseISO(t.date), 'dd/MM/yyyy'),
        `"${t.description.replace(/"/g, '""')}"`,
        `"${cat?.name || ''}"`,
        type,
        t.amount.toString().replace('.', ','),
        status
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transacoes_${format(selectedDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async (type: 'single' | 'future' | 'all') => {
    if (!transactionToDelete) return;

    if (type === 'single') {
      deleteTransaction(transactionToDelete.id).catch(console.error);
    } else {
      const baseDate = new Date(transactionToDelete.date);
      const groupId = transactionToDelete.groupId;
      const idsToDelete: string[] = [];
      
      transactions.forEach(t => {
        const isSameGroup = groupId && t.groupId === groupId;
        const isSameSeriesFallback = !groupId && 
          t.description === transactionToDelete.description && 
          t.categoryId === transactionToDelete.categoryId && 
          t.type === transactionToDelete.type;

        if (!isSameGroup && !isSameSeriesFallback) return;

        if (type === 'all') {
          idsToDelete.push(t.id);
        } else if (type === 'future' && new Date(t.date) >= baseDate) {
          idsToDelete.push(t.id);
        }
      });

      if (idsToDelete.length > 0) {
        bulkDeleteTransactions(idsToDelete).catch(console.error);
      }
    }

    toast.success(t('transactionDeleted'));
    setTransactionToDelete(null);
  };

  const handleToggleStatus = (id: string, currentStatus: 'paid' | 'pending', e: React.MouseEvent) => {
    e.stopPropagation();
    updateTransaction(id, { status: currentStatus === 'paid' ? 'pending' : 'paid' });
  };

  const formatCurrency = (value: number) => {
    if (!userSettings.showValues) return `${userSettings.currency === 'BRL' ? 'R$' : userSettings.currency === 'USD' ? '$' : '€'} •••••`;
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(value);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('transactions')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const prev = new Date(selectedDate);
            prev.setMonth(prev.getMonth() - 1);
            setSelectedDate(prev);
          }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-500" />
          </button>
          
          <div 
            className="text-zinc-900 dark:text-white font-semibold text-lg min-w-[120px] text-center cursor-pointer select-none hover:text-[#8B5CF6] transition-colors"
            onClick={() => setIsMonthPickerOpen(true)}
          >
            {format(selectedDate, 'MMMM yyyy', { locale: userSettings.language === 'en' ? enUS : userSettings.language === 'es' ? es : ptBR })}
          </div>

          <button onClick={() => {
            const next = new Date(selectedDate);
            next.setMonth(next.getMonth() + 1);
            setSelectedDate(next);
          }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="default" 
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-9 px-4"
            onClick={() => setIsMenuOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newTransaction')}
          </Button>
          <NewTransactionDialog 
            open={isNewDialogOpen} 
            onOpenChange={(open) => {
              setIsNewDialogOpen(open);
              if (!open) setEditingTransactionId(undefined);
            }}
            initialDate={(location.state as any)?.date}
            initialType={newTransactionType}
            transactionId={editingTransactionId}
          />
          <div className="relative flex-1 md:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar"
              className="pl-9 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full no-scrollbar shrink-0">
            <Button 
              variant={typeFilter === 'all' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-full h-8 px-3 text-xs shrink-0"
              onClick={() => setTypeFilter('all')}
            >
              {t('all')}
            </Button>
            <Button 
              variant={typeFilter === 'income' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-full h-8 px-3 text-xs shrink-0"
              onClick={() => setTypeFilter('income')}
            >
              {t('incomes')}
            </Button>
            <Button 
              variant={typeFilter === 'expense' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-full h-8 px-3 text-xs shrink-0"
              onClick={() => setTypeFilter('expense')}
            >
              {t('expenses')}
            </Button>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => setIsImportCsvOpen(true)}
              title="Importar CSV"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={handleExportCSV}
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all"
          onClick={() => navigate('/')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[#9F9FA9]">{t('monthBalance')} ({currentMonthTransactions.length} itens)</p>
                <p className="font-bold text-[#50A2FF]">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all"
          onClick={() => navigate('/incomes')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#01bfa5]/10 dark:bg-[#01bfa5]/20 text-[#01bfa5] rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('incomes')} ({currentMonthTransactions.filter(t => t.type === 'income').length})</p>
                <p className="font-bold text-[#01bfa5]">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all"
          onClick={() => navigate('/expenses')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ee5350]/10 dark:bg-[#ee5350]/20 text-[#ee5350] rounded-full flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('expenses')} ({currentMonthTransactions.filter(t => t.type === 'expense').length})</p>
                <p className="font-bold text-[#ee5350]">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="rounded-2xl border border-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 shadow-sm bg-card cursor-pointer hover:bg-secondary transition-all"
          onClick={() => navigate('/reports')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                <ScaleIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">{t('monthlyBalance')}</p>
                <p className="font-bold text-purple-400">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-[#1A1A1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">{t('status')}</th>
                <th className="px-6 py-4 font-medium">{t('date')}</th>
                <th className="px-6 py-4 font-medium">{t('description')}</th>
                <th className="px-6 py-4 font-medium">{t('category')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('value')}</th>
                <th className="px-6 py-4 font-medium text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.map((t) => {
                const category = getCategory(t.categoryId);
                return (
                  <tr 
                    key={t.id} 
                    className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTransaction({ ...t, category })}
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => handleToggleStatus(t.id, t.status, e)}
                        className="focus:outline-none"
                      >
                        {t.status === 'paid' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#01bfa5]" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {format(parseISO(t.date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {t.description}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: category?.color || '#ccc' }}
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{category?.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); }}>
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => handleDelete(t.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    {t('noTransactionsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white">{t('transactionDetails')}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedTransaction.type === 'income' ? 'bg-[#01bfa5]/10 text-[#01bfa5] dark:bg-[#01bfa5]/20' : 'bg-[#ee5350]/10 text-[#ee5350] dark:bg-[#ee5350]/20'}`}>
                  {selectedTransaction.type === 'income' ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                </div>
                <h2 className={`text-2xl font-bold ${selectedTransaction.type === 'income' ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">{selectedTransaction.description}</p>
              </div>

              <div className="space-y-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('date')}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{format(parseISO(selectedTransaction.date), "dd 'de' MMMM 'de' yyyy", { locale: userSettings.language === 'en' ? enUS : userSettings.language === 'es' ? es : ptBR })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('category')}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTransaction.category?.color || '#ccc' }} />
                    <span className="font-medium text-zinc-900 dark:text-white">{selectedTransaction.category?.name}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('status')}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {selectedTransaction.status === 'paid' ? t('paid') : t('pending')}
                  </span>
                </div>
                {selectedTransaction.isFixed && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Tipo</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{t('fixedTransaction')}</span>
                  </div>
                )}
              </div>

              {(() => {
                if (!selectedTransaction?.description) return null;
                const searchDesc = selectedTransaction.description.trim().toLowerCase();
                const history = transactions.filter(t => 
                  t.id !== selectedTransaction.id && 
                  t.description && 
                  t.description.trim().toLowerCase() === searchDesc
                ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
                
                if (history.length > 0) {
                  return (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Histórico de "{selectedTransaction.description}"</h4>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto">
                        {history.map(ht => {
                          const diff = selectedTransaction.amount - ht.amount;
                          const perc = ht.amount > 0 ? (diff / ht.amount) * 100 : 0;
                          return (
                            <div key={ht.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <span className="text-xs text-zinc-500">{format(parseISO(ht.date), "dd/MM/yyyy")}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-zinc-500'}`}>
                                  {diff > 0 ? '+' : ''}{diff !== 0 ? `${perc.toFixed(1)}%` : '='}
                                </span>
                                <span className="text-sm font-medium">{formatCurrency(ht.amount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTransaction(null)}>
                  {t('close')}
                </Button>
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    setEditingTransactionId(selectedTransaction.id);
                    setIsNewDialogOpen(true);
                    setSelectedTransaction(null);
                  }}
                >
                  {t('edit')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <MonthPicker 
        open={isMonthPickerOpen} 
        onOpenChange={setIsMonthPickerOpen} 
        selectedDate={selectedDate} 
        onSelect={setSelectedDate} 
      />

      <Dialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Filter className="w-5 h-5 text-red-500" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Como você deseja excluir esta transação fixa?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => confirmDelete('single')} className="flex-1">
            Apenas esta
          </Button>
          <Button variant="outline" onClick={() => confirmDelete('future')} className="flex-1">
            Esta e futuras
          </Button>
          <Button variant="destructive" onClick={() => confirmDelete('all')} className="flex-1">
            Toda a série
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionMenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={handleMenuSelect} 
      />
      <ImportCsvDialog open={isImportCsvOpen} onOpenChange={setIsImportCsvOpen} />
    </div>
  );
};

function WalletIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function ScaleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}
