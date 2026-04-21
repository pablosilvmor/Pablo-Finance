import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowUpRight, Filter, Search, MoreVertical, CheckCircle2, Circle, TrendingUp, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { NewTransactionDialog } from '@/components/NewTransactionDialog';
import { MonthPicker } from '@/components/MonthPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Transaction } from '../types';

const SortableRow = ({ 
  transaction, 
  category, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isManualSort,
  formatCurrency
}: { 
  transaction: Transaction; 
  category: any; 
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleStatus: (id: string, status: 'paid' | 'pending', e: React.MouseEvent) => void;
  isManualSort: boolean;
  formatCurrency: (value: number) => string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: transaction.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group",
        isDragging && "bg-zinc-100 dark:bg-zinc-800"
      )}
      onClick={(e) => onEdit(transaction.id, e)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {isManualSort && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              <GripVertical className="w-4 h-4 text-zinc-400" />
            </div>
          )}
          <button 
            onClick={(e) => onToggleStatus(transaction.id, transaction.status, e)}
            className="focus:outline-none"
          >
            {transaction.status === 'paid' ? (
              <CheckCircle2 className="w-5 h-5 text-[#01bfa5]" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
            )}
          </button>
        </div>
      </td>
      <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        {format(parseISO(transaction.date), "dd/MM/yy")}
      </td>
      <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-2">
          {transaction.description}
          {transaction.isFixed && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500">Fixa</span>}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category?.color || '#ccc' }} />
          <span className="text-zinc-700 dark:text-zinc-300">{category?.name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-right font-bold text-[#01bfa5] whitespace-nowrap">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onEdit(transaction.id, e)}>
            <Edit2 className="w-4 h-4 text-zinc-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onDelete(transaction.id, e)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export const Incomes = () => {
  const { transactions, deleteTransaction, bulkDeleteTransactions, bulkUpdateTransactions, updateTransaction, categories, userSettings, setTransactions } = useAppStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'description' | 'amount' | 'manual'>('date');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const incomes = transactions.filter(t => t.type === 'income');
  
  const monthlyIncomes = incomes.filter(t => 
    isSameMonth(parseISO(t.date), currentDate)
  );

  const totalIncome = monthlyIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceived = monthlyIncomes.filter(t => t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = monthlyIncomes.filter(t => t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  const filteredIncomes = monthlyIncomes.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'description') return a.description.localeCompare(b.description);
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'manual') return (a.sortOrder || 0) - (b.sortOrder || 0);
    return 0;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredIncomes.findIndex((t) => t.id === active.id);
      const newIndex = filteredIncomes.findIndex((t) => t.id === over.id);
      
      const newOrderedList = arrayMove(filteredIncomes, oldIndex, newIndex);
      
      // Update sortOrder for all items in the current month
      const updatedTransactions = [...transactions];
      const updates: { id: string; data: Partial<Transaction> }[] = [];
      
      newOrderedList.forEach((item, index) => {
        const transIndex = updatedTransactions.findIndex(t => t.id === item.id);
        if (transIndex !== -1) {
          updatedTransactions[transIndex] = { ...updatedTransactions[transIndex], sortOrder: index };
          updates.push({ id: item.id, data: { sortOrder: index } });
        }
      });
      
      setTransactions(updatedTransactions);
      if (updates.length > 0) {
        bulkUpdateTransactions(updates).catch(console.error);
      }
      setSortBy('manual');
    }
  };

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleToggleStatus = (id: string, currentStatus: 'paid' | 'pending', e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    updateTransaction(id, { status: newStatus });
    
    toast.success(currentStatus === 'paid' ? 'Receita marcada como pendente' : 'Receita marcada como recebida', {
      action: {
        label: 'Desfazer',
        onClick: () => updateTransaction(id, { status: currentStatus })
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    setTransactionToDelete(transactionToDelete);
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

    toast.success('Receita excluída');
    setTransactionToDelete(null);
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTransactionId(id);
    setIsEditDialogOpen(true);
  };

  // Group by category for the chart
  const categoryData = React.useMemo(() => {
    const categoryTotals = monthlyIncomes.reduce((acc, curr) => {
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
  }, [monthlyIncomes, categories]);

  const ChartComponent = categoryData.length > 5 ? BarChart : PieChart;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Minhas Receitas</h1>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 self-center">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span 
            className="text-sm font-semibold min-w-[120px] text-center capitalize cursor-pointer select-none hover:text-[#8B5CF6] transition-colors"
            onClick={() => setIsMonthPickerOpen(true)}
          >
            {format(currentDate, 'MMMM yyyy', { locale: getDateLocale() })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar receita..."
              className="h-9 pl-9 pr-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5"
              >
                <X className="h-4 w-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
            <Button 
              variant={sortBy === 'date' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-[10px] px-3"
              onClick={() => setSortBy('date')}
            >
              Data
            </Button>
            <Button 
              variant={sortBy === 'description' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-[10px] px-3"
              onClick={() => setSortBy('description')}
            >
              Nome
            </Button>
            <Button 
              variant={sortBy === 'amount' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-[10px] px-3"
              onClick={() => setSortBy('amount')}
            >
              Valor
            </Button>
            <Button 
              variant={sortBy === 'manual' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-[10px] px-3"
              onClick={() => setSortBy('manual')}
            >
              Manual
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm bg-white dark:bg-[#2c2c2e] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total do mês ({monthlyIncomes.length} itens)</p>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {formatCurrency(totalIncome)}
                </h2>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20">
                <p className="text-xs text-[#01bfa5] mb-1">Total recebido ({monthlyIncomes.filter(t => t.status === 'paid').length})</p>
                <h2 className="text-xl font-bold text-[#01bfa5]">
                  {formatCurrency(totalReceived)}
                </h2>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20">
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Pendente ({monthlyIncomes.filter(t => t.status === 'pending').length})</p>
                <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalPending)}
                </h2>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {filteredIncomes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500">Nenhuma receita encontrada para este mês.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={filteredIncomes.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                          <tr>
                            <th className="px-4 py-3 font-medium">Situação</th>
                            <th className="px-4 py-3 font-medium">Data</th>
                            <th className="px-4 py-3 font-medium">Descrição</th>
                            <th className="px-4 py-3 font-medium">Categoria</th>
                            <th className="px-4 py-3 font-medium text-right">Valor</th>
                            <th className="px-4 py-3 font-medium text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {filteredIncomes.map((t) => (
                            <SortableRow 
                              key={t.id}
                              transaction={t}
                              category={getCategory(t.categoryId)}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggleStatus={handleToggleStatus}
                              isManualSort={sortBy === 'manual'}
                              formatCurrency={formatCurrency}
                            />
                          ))}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-[#2c2c2e]">
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full min-w-0 min-h-0">
                  {categoryData.length > 5 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const value = payload[0].value as number;
                              const total = categoryData.reduce((acc, cur) => acc + cur.value, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              return (
                                <div style={{ 
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                  borderRadius: '12px', 
                                  border: '1px solid #333',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  padding: '12px'
                                }}>
                                  <p style={{ color: '#white', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }} className="text-white">{data.name}</p>
                                  <p style={{ color: data.color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                    Valor: {formatCurrency(value)} ({percentage}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const value = payload[0].value as number;
                              const total = categoryData.reduce((acc, cur) => acc + cur.value, 0);
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
                                  <p style={{ color: data.color || (payload[0] as any).color, fontWeight: '500', margin: 0, fontSize: '14px' }}>
                                    Valor: {formatCurrency(value)} ({percentage}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
              </div>
              <div className="space-y-2 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-600 dark:text-zinc-400">{item.name}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 opacity-80" />
                <h3 className="font-semibold">Bom trabalho!</h3>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                Suas receitas estão estáveis este mês. Continue acompanhando para garantir que seus objetivos financeiros sejam atingidos.
              </p>
              <Button className="w-full mt-4 bg-white/20 hover:bg-white/30 border-none text-white">
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewTransactionDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        transactionId={editingTransactionId} 
      />

      <Dialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar exclusão
            </DialogTitle>
          <DialogDescription>
            Como você deseja excluir esta receita fixa?
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

      <MonthPicker 
        open={isMonthPickerOpen} 
        onOpenChange={setIsMonthPickerOpen} 
        selectedDate={currentDate} 
        onSelect={setCurrentDate} 
      />
    </motion.div>
  );
};
