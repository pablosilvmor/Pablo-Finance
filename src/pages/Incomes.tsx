import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowUpRight, Filter, Search, MoreVertical, CheckCircle2, Circle, TrendingUp, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Edit2, Trash2, AlertTriangle, X, ArrowUp, ArrowDown, ArrowUpDown, Download, Tag, ChevronDown, FileText, FileX, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { NewTransactionDialog } from '@/components/NewTransactionDialog';
import { MonthPicker } from '@/components/MonthPicker';
import { CategoryBadge } from '@/components/CategoryBadge';
import { iconMap } from '@/lib/icons';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
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
  onToggleIgnore,
  isManualSort,
  formatCurrency,
  isSelected,
  onSelect,
  isSelectionMode,
  getTag
}: { 
  transaction: Transaction; 
  category: any; 
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleStatus: (id: string, status: 'paid' | 'pending', e: React.MouseEvent) => void;
  onToggleIgnore: (id: string, e: React.MouseEvent) => void;
  isManualSort: boolean;
  formatCurrency: (value: number) => string;
  isSelected?: boolean;
  onSelect?: (id: string, e: React.MouseEvent) => void;
  isSelectionMode?: boolean;
  getTag: (id: string) => any;
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
        "transition-colors cursor-pointer group",
        isSelected ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
        isDragging && "bg-zinc-100 dark:bg-zinc-800"
      )}
      onClick={(e) => onEdit(transaction.id, e)}
    >
      {isSelectionMode && (
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
              checked={isSelected}
              onChange={(e) => onSelect?.(transaction.id, e as any)}
            />
          </div>
        </td>
      )}
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
          <span 
            className={cn(
              "flex items-center justify-center p-1.5 rounded-md transition-all cursor-pointer border",
              transaction.ignored 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10" 
                : "bg-transparent border-transparent text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
            onClick={(e) => { e.stopPropagation(); onToggleIgnore(transaction.id, e); }}
            title={transaction.ignored ? "Restaurar transação" : "Ignorar transação"}
          >
            <FileX className="w-[18px] h-[18px]" />
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        {format(parseISO(transaction.date), "dd/MM/yy")}
      </td>
      <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {transaction.description}
            {transaction.isFixed && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500">Fixa</span>}
          </div>
          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {transaction.tags.map(tagId => {
                const tag = getTag(tagId);
                if (!tag) return null;
                const Icon = iconMap[tag.icon || 'tag'] || Tag;
                return (
                  <div key={tag.id} className="inline-flex items-center gap-1.5 mr-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">
                      {tag.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <CategoryBadge category={category} />
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
  const { transactions, deleteTransaction, bulkDeleteTransactions, bulkUpdateTransactions, updateTransaction, categories, userSettings, setTransactions, tags, viewDate: currentDate, setViewDate: setCurrentDate } = useAppStore();
  const getCategory = (id: string) => categories.find(c => c.id === id);
  const navigate = useNavigate();
  const getTag = (id: string) => tags.find(t => t.id === id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'description' | 'amount' | 'manual' | 'status' | 'category'>(() => {
    return (localStorage.getItem('incomes-sort') as any) || 'date';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('incomes-sort-order') as any) || 'desc';
  });

  useEffect(() => {
    localStorage.setItem('incomes-sort', sortBy);
    localStorage.setItem('incomes-sort-order', sortOrder);
  }, [sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'description' | 'amount' | 'manual' | 'status' | 'category') => {
    if (sortBy === field && field !== 'manual') {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
  };
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.date) {
      const stateDate = new Date(location.state.date);
      if (stateDate.getMonth() !== currentDate.getMonth() || stateDate.getFullYear() !== currentDate.getFullYear()) {
        setCurrentDate(stateDate);
      }
    }
  }, [location.state]);

  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleDeleteSelected = () => {
    if (selectedTransactionIds.length === 0) return;
    bulkDeleteTransactions(selectedTransactionIds).then(() => {
      toast.success(`${selectedTransactionIds.length} ${selectedTransactionIds.length === 1 ? 'item excluído' : 'itens excluídos'}!`);
      setSelectedTransactionIds([]);
      setIsSelectionMode(false);
    }).catch(console.error);
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

  const totalIncome = monthlyIncomes.filter(t => !t.ignored).reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceived = monthlyIncomes.filter(t => t.status === 'paid' && !t.ignored).reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = monthlyIncomes.filter(t => t.status === 'pending' && !t.ignored).reduce((acc, curr) => acc + curr.amount, 0);

  const filteredIncomes = monthlyIncomes.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesTag = tagFilter === 'all' || (t.tags && t.tags.includes(tagFilter));
    const matchesCategory = categoryIdFilter === 'all' || t.categoryId === categoryIdFilter;
    return matchesSearch && matchesStatus && matchesTag && matchesCategory;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    else if (sortBy === 'description') comparison = a.description.localeCompare(b.description);
    else if (sortBy === 'amount') comparison = a.amount - b.amount;
    else if (sortBy === 'manual') comparison = (a.sortOrder || 0) - (b.sortOrder || 0);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'category') {
      const catA = getCategory(a.categoryId)?.name || '';
      const catB = getCategory(b.categoryId)?.name || '';
      comparison = catA.localeCompare(catB);
    }
    if (sortBy === 'manual') return comparison;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTransactionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedTransactionIds.length === filteredIncomes.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(filteredIncomes.map(t => t.id));
    }
  };

  const dailyTotals = React.useMemo(() => {
    const results: Record<string, number> = {};
    const sortedDates = [...new Set(filteredIncomes.map(t => t.date))];
    
    sortedDates.forEach(date => {
       results[date] = filteredIncomes
         .filter(t => t.date === date && !t.ignored)
         .reduce((s, c) => s + c.amount, 0);
    });
    return results;
  }, [filteredIncomes]);

  const handleExportCSV = () => {
    const headers = ['Situação', 'Data', 'Descrição', 'Categoria', 'Valor'];
    const rows = filteredIncomes.map(t => {
      const cat = getCategory(t.categoryId);
      const status = t.status === 'paid' ? 'Recebido' : 'Pendente';
      return [
        status,
        format(parseISO(t.date), 'dd/MM/yyyy'),
        `"${t.description.replace(/"/g, '""')}"`,
        `"${cat?.name || ''}"`,
        t.amount.toString().replace('.', ',')
      ].join(';');
    });
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receitas_${format(currentDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleIgnore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;
    updateTransaction(id, { ignored: !trans.ignored });
  };

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
    setIsSelectionMode(true);
    if (!selectedTransactionIds.includes(id)) {
      setSelectedTransactionIds(prev => [...prev, id]);
    }
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
    const categoryTotals = monthlyIncomes.filter(t => !t.ignored).reduce((acc, curr) => {
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
      className="max-w-7xl mx-auto pb-20 md:pb-0 md:h-full md:flex md:flex-col md:overflow-hidden space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center justify-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Minhas Receitas</h1>
          </div>

          <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full h-8 w-8 hover:bg-[#01BFA5]/10 hover:text-[#01BFA5]">
            <ChevronLeft className="w-5 h-5 text-[#01BFA5]" />
          </Button>
          <span 
            className="text-[#01BFA5] font-semibold text-sm min-w-[120px] text-center capitalize cursor-pointer select-none hover:bg-[#01BFA5]/10 transition-colors border-[1.5px] border-[#01BFA5] rounded-full px-4 py-1.5"
            onClick={() => setIsMonthPickerOpen(true)}
          >
            {(() => {
              const formatted = format(currentDate, 'MMMM yyyy', { locale: getDateLocale() });
              return formatted.charAt(0).toUpperCase() + formatted.slice(1);
            })()}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full h-8 w-8 hover:bg-[#01BFA5]/10 hover:text-[#01BFA5]">
            <ChevronRight className="w-5 h-5 text-[#01BFA5]" />
          </Button>
        </div>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center md:justify-end gap-3 w-full lg:w-auto">
          <div className="flex items-center justify-center gap-2 w-full md:w-auto order-2 md:order-1">
            <DropdownMenu>
              <DropdownMenuTrigger
              className={cn(
                "flex items-center justify-center rounded-full h-9 w-9 border transition-colors cursor-pointer",
                (statusFilter !== 'all' || tagFilter !== 'all' || categoryIdFilter !== 'all') 
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
                  : 'bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800'
              )}
            >
              <Filter className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-[500px] overflow-y-auto">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 px-2 tracking-wider">Situação</p>
                    <div className="flex flex-wrap gap-1">
                      <Button 
                        variant={statusFilter === 'all' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setStatusFilter('all')} 
                        className="rounded-full h-7 text-[10px]"
                      >
                        Todos
                      </Button>
                      <Button 
                        variant={statusFilter === 'paid' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setStatusFilter('paid')}
                        className="rounded-full h-7 text-[10px]"
                      >
                        Recebidos
                      </Button>
                      <Button 
                        variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setStatusFilter('pending')}
                        className="rounded-full h-7 text-[10px]"
                      >
                        Pendentes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 px-2 tracking-wider">Tags</p>
                    <div className="grid grid-cols-1 gap-1">
                      <Button
                        variant={tagFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="justify-start font-normal text-xs h-8"
                        onClick={() => setTagFilter('all')}
                      >
                        Todas as Tags
                      </Button>
                      {tags.map(tag => {
                        const Icon = iconMap[tag.icon || 'tag'] || Tag;
                        return (
                          <Button
                            key={tag.id}
                            variant={tagFilter === tag.id ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start font-normal text-xs h-8 gap-2"
                            onClick={() => setTagFilter(tag.id)}
                          >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: tag.color }}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="truncate">{tag.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 px-2 tracking-wider">Categorias</p>
                    <div className="grid grid-cols-1 gap-1">
                      <Button
                        variant={categoryIdFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="justify-start font-normal text-xs h-8"
                        onClick={() => setCategoryIdFilter('all')}
                      >
                        Todas as Categorias
                      </Button>
                      {categories.filter(c => c.type === 'income').map(cat => {
                        const Icon = iconMap[cat.icon] || FileText;
                        return (
                          <Button
                            key={cat.id}
                            variant={categoryIdFilter === cat.id ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start font-normal text-xs h-8 gap-2"
                            onClick={() => setCategoryIdFilter(cat.id)}
                          >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="truncate">{cat.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[10px] h-7"
                    onClick={() => {
                      setStatusFilter('all');
                      setTagFilter('all');
                      setCategoryIdFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
            <Button 
              variant={sortBy === 'date' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-xs px-3"
              onClick={() => handleSort('date')}
            >
              Data
            </Button>
            <Button 
              variant={sortBy === 'description' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-xs px-3"
              onClick={() => handleSort('description')}
            >
              Nome
            </Button>
            <Button 
              variant={sortBy === 'amount' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-xs px-3"
              onClick={() => handleSort('amount')}
            >
              Valor
            </Button>
            <Button 
              variant={sortBy === 'manual' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-7 text-xs px-3"
              onClick={() => handleSort('manual')}
            >
              Manual
            </Button>
          </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-end gap-2 w-full md:w-auto order-3 md:order-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar receita..."
                  className="h-9 pl-9 pr-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
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

              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full shrink-0 gap-2 border-zinc-200 dark:border-zinc-800 h-9"
                onClick={handleExportCSV}
                title="Exportar CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar .csv</span>
              </Button>
            </div>
          </div>
          {isSelectionMode && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-9 px-4"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedTransactionIds([]);
                }}
              >
                Cancelar
              </Button>
              {selectedTransactionIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-full shrink-0 h-9 px-3 bg-red-500 hover:bg-red-600 gap-2"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:inline">Confirmar ({selectedTransactionIds.length})</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:flex-1 md:min-h-0">
        <Card className="lg:col-span-3 rounded-3xl border-none shadow-sm bg-white dark:bg-[#2c2c2e] md:flex md:flex-col md:h-full overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-transparent shadow-sm bg-zinc-50 dark:bg-zinc-900/50">
                <CardContent className="p-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Total do mês ({monthlyIncomes.length})</p>
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-transparent shadow-sm bg-green-50 dark:bg-green-900/10">
                <CardContent className="p-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#01bfa5]">Recebido ({monthlyIncomes.filter(t => t.status === 'paid').length})</p>
                    <p className="font-bold text-[#01bfa5]">
                      {formatCurrency(totalReceived)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1 rounded-2xl border border-transparent shadow-sm bg-orange-50 dark:bg-orange-900/10">
                <CardContent className="p-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Pendente ({monthlyIncomes.filter(t => t.status === 'pending').length})</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(totalPending)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardHeader>
          <CardContent className="md:flex-1 md:overflow-y-auto p-0">
            <div className="space-y-4 p-6 pt-4">
              {filteredIncomes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500">Nenhuma receita encontrada para este mês.</p>
                </div>
              ) : (
                <>
                  {/* Mobile List View */}
                  <div className="md:hidden space-y-4">
                    {filteredIncomes.map((t, index) => {
                      const category = getCategory(t.categoryId);
                      const Icon = category ? iconMap[category.icon || 'tag'] || Tag : Tag;
                      const isNewDate = index === 0 || t.date !== filteredIncomes[index - 1].date;
                      return (
                        <React.Fragment key={t.id}>
                          {isNewDate && (
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2 mt-4 first:mt-0 flex items-center justify-between">
                              <span>
                                {format(parseISO(t.date), "EEEE, dd", { locale: ptBR }).split('-')[0].charAt(0).toUpperCase() + format(parseISO(t.date), "EEEE, dd", { locale: ptBR }).split('-')[0].slice(1)}
                              </span>
                              <span className="text-sm font-medium text-zinc-500">
                                {formatCurrency(dailyTotals[t.date] || 0)}
                              </span>
                            </h3>
                          )}
                          <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-zinc-100 dark:border-[#2C2C2E] mb-4" onClick={(e) => handleEdit(t.id, e)}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#01BFA5]/10 text-[#01BFA5] shrink-0">
                               <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.description}</p>
                              <p className="text-sm text-zinc-500">{category?.name || 'Sem categoria'} • {format(parseISO(t.date), "dd/MM/yy")}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                               <p className="font-bold text-[#01bfa5] text-sm">{formatCurrency(t.amount)}</p>
                               <div className="flex items-center gap-2">
                                 {t.status === 'paid' && <CheckCircle2 className="w-5 h-5 text-[#01bfa5]" />}
                                 <DropdownMenu>
                                   <DropdownMenuTrigger render={
                                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
                                       <MoreVertical className="w-4 h-4 text-zinc-500" />
                                     </Button>
                                   } />
                                   <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                     <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(t.id); }} className="gap-2">
                                       {t.status === 'paid' ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                       Marcar como {t.status === 'paid' ? 'Pendente' : 'Pago'}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleIgnore(t.id); }} className="gap-2">
                                       <EyeOff className="w-4 h-4" />
                                       {t.ignored ? 'Considerar' : 'Ignorar'}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="gap-2 text-red-500 focus:text-red-500">
                                       <Trash2 className="w-4 h-4" />
                                       Excluir
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                               </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto md:overflow-visible">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={filteredIncomes.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <table className="w-full text-sm text-left border-separate border-spacing-0">
                        <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase sticky top-0 z-30 shadow-sm">
                          <tr className="bg-white dark:bg-[#2C2C2E]">
                            {isSelectionMode && (
                              <th className="px-4 py-3 font-medium w-12 text-center bg-inherit">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                                  checked={selectedTransactionIds.length === filteredIncomes.length && filteredIncomes.length > 0}
                                  onChange={toggleAllSelection}
                                />
                              </th>
                            )}
                            <th className="px-4 py-3 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center bg-inherit" onClick={() => handleSort('status')}>
                              <div className="flex items-center justify-center gap-1">
                                Situação
                                {sortBy === 'status' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                              </div>
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center bg-inherit" onClick={() => handleSort('date')}>
                              <div className="flex items-center justify-center gap-1">
                                Data
                                {sortBy === 'date' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                              </div>
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center bg-inherit" onClick={() => handleSort('description')}>
                              <div className="flex items-center justify-center gap-1">
                                Descrição
                                {sortBy === 'description' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                              </div>
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center bg-inherit" onClick={() => handleSort('category')}>
                              <div className="flex items-center justify-center gap-1">
                                Categoria
                                {sortBy === 'category' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                              </div>
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center bg-inherit" onClick={() => handleSort('amount')}>
                              <div className="flex items-center justify-center gap-1">
                                {sortBy === 'amount' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                                Valor
                              </div>
                            </th>
                            <th className="px-4 py-3 font-medium text-center bg-inherit">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {filteredIncomes.map((t, index) => {
                            const nextT = filteredIncomes[index + 1];
                            const isLastOfDate = !nextT || nextT.date !== t.date;
                            return (
                              <React.Fragment key={t.id}>
                                <SortableRow 
                                  transaction={t}
                                  category={getCategory(t.categoryId)}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  onToggleStatus={handleToggleStatus}
                                  onToggleIgnore={handleToggleIgnore}
                                  isManualSort={sortBy === 'manual'}
                                  formatCurrency={formatCurrency}
                                  isSelected={selectedTransactionIds.includes(t.id)}
                                  onSelect={toggleSelection}
                                  isSelectionMode={isSelectionMode}
                                  getTag={getTag}
                                />
                                {isLastOfDate && (
                                  <tr className="bg-green-500/5 dark:bg-green-500/10 border-b border-zinc-100 dark:border-zinc-800/50">
                                    <td colSpan={isSelectionMode ? 5 : 4} className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 font-medium italic text-xs">
                                      Saldo do Final do Dia
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-zinc-500 dark:text-zinc-400">
                                      {formatCurrency(dailyTotals[t.date])}
                                    </td>
                                    <td></td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              </>
            )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 md:h-full md:flex md:flex-col md:min-h-0">
          <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-[#2c2c2e] md:flex-1 md:flex md:flex-col md:min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="md:flex-1 md:min-h-0">
              <div className="h-[250px] md:h-full w-full min-w-0 min-h-0">
                  {categoryData.length > 5 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                        <Tooltip 
                          trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
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
                                    Valor: {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
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
                          trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
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
                                    Valor: {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
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
