import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MoreVertical, Search, Filter, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, X, Trash2, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Tag, FileX, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, isSameMonth, endOfMonth, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';
import { NewTransactionDialog } from '@/components/NewTransactionDialog';
import { MonthPicker } from '@/components/MonthPicker';
import { TransactionMenuOverlay } from '@/components/TransactionMenuOverlay';
import { ImportCsvDialog } from '@/components/ImportCsvDialog';
import { useTranslation } from '@/lib/i18n';
import { CategoryBadge } from '@/components/CategoryBadge';
import { iconMap } from '@/lib/icons';
import { cn } from '@/lib/utils';

import { TransactionFilterDialog, FilterConfig } from '@/components/TransactionFilterDialog';

export const Transactions = () => {
  const { transactions, activeTransactions, categories, deleteTransaction, bulkDeleteTransactions, bulkUpsertTransactions, updateTransaction, userSettings, tags, piggyBank, viewDate: selectedDate, setViewDate: setSelectedDate } = useAppStore();
  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getTag = (id: string) => tags.find(t => t.id === id);
  const { t } = useTranslation(userSettings.language);
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).date) {
      const stateDate = new Date((location.state as any).date);
      if (stateDate.getMonth() !== selectedDate.getMonth() || stateDate.getFullYear() !== selectedDate.getFullYear()) {
        setSelectedDate(stateDate);
      }
    }
  }, [location.state]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    startDate: startOfMonth(selectedDate),
    endDate: endOfMonth(selectedDate),
    categories: [],
    tags: [],
    accounts: [],
    statuses: [],
    type: 'all'
  });
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Update filters when selectedDate changes to keep date range synced with month selector
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      startDate: startOfMonth(selectedDate),
      endDate: endOfMonth(selectedDate)
    }));
  }, [selectedDate]);

  // Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'description' | 'amount' | 'category' | 'type' | 'status'>(() => {
    return (localStorage.getItem('transactions-sort') as any) || 'date';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('transactions-sort-order') as any) || 'desc';
  });

  useEffect(() => {
    localStorage.setItem('transactions-sort', sortBy);
    localStorage.setItem('transactions-sort-order', sortOrder);
  }, [sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'description' | 'amount' | 'category' | 'type' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
  };

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const navigate = useNavigate();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'expense' | 'income'>('expense');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { openNew?: boolean; date?: string } | null;
    if (state?.openNew) {
      setIsMenuOpen(true);
    }
  }, [location.state]);

  const handleMenuSelect = (type: 'expense' | 'income') => {
    setIsMenuOpen(false);
    setNewTransactionType(type);
    setIsNewDialogOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      
      // Date Range Filter
      const isWithinDateRange = isWithinInterval(transactionDate, {
        start: filters.startDate,
        end: filters.endDate
      });
      if (!isWithinDateRange) return false;

      // Search Term Filter
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Type Filter
      const matchesType = filters.type === 'all' || t.type === filters.type;
      if (!matchesType) return false;

      // Category Filter
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(t.categoryId);
      if (!matchesCategory) return false;

      // Tag Filter
      const matchesTag = filters.tags.length === 0 || (t.tags && t.tags.some(tagId => filters.tags.includes(tagId)));
      if (!matchesTag) return false;

      // Account Filter
      const matchesAccount = filters.accounts.length === 0 || (t.accountId && filters.accounts.includes(t.accountId));
      if (!matchesAccount) return false;

      // Status Filter
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(t.status);
      if (!matchesStatus) return false;

      return true;
    }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'category':
        const catA = getCategory(a.categoryId)?.name || '';
        const catB = getCategory(b.categoryId)?.name || '';
        comparison = catA.localeCompare(catB);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [transactions, filters, searchTerm, sortBy, sortOrder, categories]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income' && !t.ignored).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && !t.ignored).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid' && !t.ignored);
    const data = expenses.reduce((acc, curr) => {
      const cat = categories.find(c => c.id === curr.categoryId);
      const name = cat?.name || 'Sem categoria';
      const color = cat?.color || '#cbd5e1';
      const existing = acc.find((item: any) => item.name === name);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name, value: curr.amount, color });
      }
      return acc;
    }, [] as any[]);
    return data.sort((a: any, b: any) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(userSettings.language, { 
    style: 'currency', 
    currency: userSettings.currency 
  }), [userSettings]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelectionMode(true);
    setSelectedTransactionIds([id]);
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

  const handleExportPDF = async () => {
    let logoBase64: string | null = null;
    let logoWidth = 0;
    let logoHeight = 0;
    
    try {
      const response = await fetch('https://i.imgur.com/6n9cYhs.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const imgProps = await new Promise<{w: number, h: number}>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = logoBase64!;
      });

      // Maintain perfect aspect ratio: we target a width of ~40mm
      const targetWidth = 40;
      logoWidth = targetWidth;
      logoHeight = targetWidth * (imgProps.h / imgProps.w);
    } catch (e) {
      console.warn('Não foi possível carregar a imagem do logo.', e);
    }

    const doc = new jsPDF();
    const headers = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']];
    
    const currencyFormatter = new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    });

    const cumulativeIncome = activeTransactions.filter(t => t.type === 'income' && t.status === 'paid' && new Date(t.date) <= filters.endDate).reduce((acc, curr) => acc + curr.amount, 0);
    const cumulativeExpense = activeTransactions.filter(t => t.type === 'expense' && t.status === 'paid' && new Date(t.date) <= filters.endDate).reduce((acc, curr) => acc + curr.amount, 0);
    const saldoDoMes = cumulativeIncome - cumulativeExpense;

    const rows = filteredTransactions.map(t => {
      const cat = getCategory(t.categoryId);
      const type = t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência');
      const status = t.status === 'paid' ? 'Pago' : 'Pendente';
      
      return [
        format(parseISO(t.date), 'dd/MM/yyyy'),
        t.description,
        cat?.name || '',
        type,
        currencyFormatter.format(t.amount),
        status
      ];
    });

    const isSameMonthFilter = isSameMonth(filters.startDate, filters.endDate);
    const dateLocale = userSettings.language === 'en' ? enUS : userSettings.language === 'es' ? es : ptBR;
    const currentMonthLabel = isSameMonthFilter 
      ? format(filters.startDate, 'MMMM yyyy', { locale: dateLocale })
      : `${format(filters.startDate, 'dd/MM/yyyy', { locale: dateLocale })} a ${format(filters.endDate, 'dd/MM/yyyy', { locale: dateLocale })}`;
    const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm');

    const totalPagesExp = '{total_pages_count_string}';

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 75,
      margin: { top: 48 }, // Increased from 42 to avoid overlap with headers naturally on page 2+
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [139, 92, 246], // Purple color from the brand
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Zebrado (slate-50)
      },
      didDrawPage: (data) => {
        // Logo / Title - Header
        if (logoBase64 && logoWidth > 0 && logoHeight > 0) {
          doc.addImage(logoBase64, 'PNG', data.settings.margin.left, 10, logoWidth, logoHeight);
        } else {
          doc.setFontSize(22);
          doc.setTextColor(139, 92, 246); // Purple
          doc.setFont('helvetica', 'bold');
          doc.text('DINDIN', data.settings.margin.left, 20);
        }
        
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`Relatório de Transações - ${currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1)}`, data.settings.margin.left, 34);

        if (data.pageNumber === 1) {
           doc.setDrawColor(226, 232, 240); // zinc-200
           doc.setFillColor(248, 250, 252); // slate-50
           const w = doc.internal.pageSize.getWidth() - data.settings.margin.left - data.settings.margin.right;
           doc.roundedRect(data.settings.margin.left, 42, w, 20, 2, 2, 'FD');
           
           const totalsY = 49;
           const valY = 56;
           
           doc.setFontSize(8);
           doc.setTextColor(100, 116, 139); // slate-500
           doc.text('SALDO DO MÊS', data.settings.margin.left + 5, totalsY);
           doc.text('RECEITAS', data.settings.margin.left + w * 0.25 + 5, totalsY);
           doc.text('DESPESAS', data.settings.margin.left + w * 0.5 + 5, totalsY);
           doc.text('BALANÇO MENSAL', data.settings.margin.left + w * 0.75 + 5, totalsY);
           
           doc.setFontSize(10);
           doc.setFont('helvetica', 'bold');
           doc.setTextColor(15, 23, 42); // slate-900
           doc.text(currencyFormatter.format(saldoDoMes), data.settings.margin.left + 5, valY);
           
           doc.setTextColor(34, 197, 94); // green-500
           doc.text(currencyFormatter.format(totalIncome), data.settings.margin.left + w * 0.25 + 5, valY);
           
           doc.setTextColor(239, 68, 68); // red-500
           doc.text(currencyFormatter.format(totalExpense), data.settings.margin.left + w * 0.5 + 5, valY);
           
           doc.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68);
           doc.text(currencyFormatter.format(balance), data.settings.margin.left + w * 0.75 + 5, valY);
           
           doc.setFont('helvetica', 'normal');
        }
      }
    });

    const element = document.getElementById('pdf-report-charts');
    let chartsImgData: string | null = null;
    let chartsImgWidth = 0;
    let chartsImgHeight = 0;
    
    if (element && expensesData.length > 0) {
      const toastId = toast.loading('Calculando gráficos para o relatório...');
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Aguarda Recharts montar
        
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#f8fafc',
          logging: false
        });
        
        chartsImgData = canvas.toDataURL('image/png', 1.0);
        chartsImgWidth = canvas.width;
        chartsImgHeight = canvas.height;

        toast.dismiss(toastId);
      } catch (err) {
        console.warn("Could not render charts", err);
        toast.dismiss(toastId);
      }
    }

    if (chartsImgData && chartsImgWidth > 0 && chartsImgHeight > 0) {
      doc.addPage();
      const margin = 14;
      const pdfWidth = doc.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = (chartsImgHeight * pdfWidth) / chartsImgWidth;
      
      // If charts are bigger than page, scale them down
      const maxPdfHeight = doc.internal.pageSize.getHeight() - margin - 40;
      let finalW = pdfWidth;
      let finalH = pdfHeight;
      if (pdfHeight > maxPdfHeight) {
         finalH = maxPdfHeight;
         finalW = (chartsImgWidth * maxPdfHeight) / chartsImgHeight;
      }
      
      // Re-draw header on charts page
      if (logoBase64 && logoWidth > 0 && logoHeight > 0) {
        doc.addImage(logoBase64, 'PNG', margin, 10, logoWidth, logoHeight);
      }
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gráficos do Relatório - ${currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1)}`, margin, 34);

      doc.addImage(chartsImgData, 'PNG', margin + (pdfWidth - finalW)/2, 45, finalW, finalH);
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const str = `Página ${i} de ${pageCount}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const margin = 14; 
        
        doc.text(str, margin, pageHeight - 10);
        doc.text(`Gerado em: ${generatedAt}`, pageSize.width - margin - 40, pageHeight - 10);
    }

    doc.save(`relatorio_dindin_${format(selectedDate, 'yyyy_MM')}.pdf`);
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

  const handleDeleteSelected = () => {
    if (selectedTransactionIds.length === 0) return;
    bulkDeleteTransactions(selectedTransactionIds).then(() => {
      toast.success(`${selectedTransactionIds.length} ${selectedTransactionIds.length === 1 ? 'item excluído' : 'itens excluídos'}!`);
      setSelectedTransactionIds([]);
      setIsSelectionMode(false);
    }).catch(console.error);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTransactionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedTransactionIds.length === filteredTransactions.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(filteredTransactions.map(t => t.id));
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

  const dailyBalances = useMemo(() => {
    const results: Record<string, number> = {};
    const sortedDates = [...new Set(filteredTransactions.map(t => t.date))].sort((a,b) => b.localeCompare(a));
    
    sortedDates.forEach(date => {
       const upToDate = transactions.filter(t => !t.ignored && t.date <= date);
       const income = upToDate.filter(t => t.type === 'income').reduce((s, c) => s + c.amount, 0);
       const expense = upToDate.filter(t => t.type === 'expense').reduce((s, c) => s + c.amount, 0);
       results[date] = income - expense;
    });
    return results;
  }, [transactions, filteredTransactions]);

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-0 md:h-full md:flex md:flex-col md:overflow-hidden space-y-6">
      <div className="shrink-0 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 -mt-4 -mx-4 md:-mx-0 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white shrink-0 text-center md:text-left">{t('transactions')}</h1>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => {
              const prev = new Date(selectedDate);
              prev.setMonth(prev.getMonth() - 1);
              setSelectedDate(prev);
            }} className="p-2 hover:bg-[#8B5CF6]/10 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#8B5CF6]" />
            </button>
            
            <div 
              className="text-[#8B5CF6] font-semibold text-base min-w-[120px] text-center cursor-pointer select-none hover:bg-[#8B5CF6]/10 transition-colors border-[1.5px] border-[#8B5CF6] rounded-full px-4 py-1.5"
              onClick={() => setIsMonthPickerOpen(true)}
            >
              {isSameMonth(filters.startDate, filters.endDate) && 
               filters.startDate.getTime() === startOfMonth(filters.startDate).getTime() && 
               filters.endDate.getTime() === endOfMonth(filters.endDate).getTime() ? (
                (() => {
                  const formatted = format(filters.startDate, 'MMMM yyyy', { locale: userSettings.language === 'en' ? enUS : userSettings.language === 'es' ? es : ptBR });
                  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                })()
              ) : (
                <span className="text-sm">{`${format(filters.startDate, 'dd/MM/yyyy')} a ${format(filters.endDate, 'dd/MM/yyyy')}`}</span>
              )}
            </div>

            <button onClick={() => {
              const next = new Date(selectedDate);
              next.setMonth(next.getMonth() + 1);
              setSelectedDate(next);
            }} className="p-2 hover:bg-[#8B5CF6]/10 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-[#8B5CF6]" />
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center md:justify-end gap-3 w-full lg:w-auto">
          <div className="order-4 md:order-0 w-full md:w-auto flex justify-center">
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
          </div>
          <div className="flex items-center justify-center gap-2 w-full md:w-auto order-2 md:order-1">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full no-scrollbar shrink-0">
              <Button 
                variant={filters.type === 'all' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-full h-8 px-3 text-xs shrink-0"
                onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
              >
                {t('all')}
              </Button>
              <Button 
                variant={filters.type === 'income' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-full h-8 px-3 text-xs shrink-0"
                onClick={() => setFilters(prev => ({ ...prev, type: 'income' }))}
              >
                {t('incomes')}
              </Button>
              <Button 
                variant={filters.type === 'expense' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-full h-8 px-3 text-xs shrink-0"
                onClick={() => setFilters(prev => ({ ...prev, type: 'expense' }))}
              >
                {t('expenses')}
              </Button>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <TransactionFilterDialog 
                categories={categories}
                tags={tags}
                accounts={piggyBank}
                currentFilters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-end gap-2 w-full md:w-auto order-3 md:order-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Buscar"
                  className="pl-9 pr-9 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-full"
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
              
              <div className="flex items-center gap-2">
                <ImportCsvDialog open={isImportCsvOpen} onOpenChange={setIsImportCsvOpen} />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800 h-9"
                  onClick={() => setIsImportCsvOpen(true)}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Importar .csv</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800 h-9">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DropdownMenuItem onClick={handleExportPDF} className="gap-2 focus:bg-zinc-100 dark:focus:bg-zinc-800">
                      <FileText className="w-4 h-4 text-red-500" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} className="gap-2 focus:bg-zinc-100 dark:focus:bg-zinc-800">
                      <FileSpreadsheet className="w-4 h-4 text-green-500" />
                      Exportar CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {isSelectionMode && selectedTransactionIds.length > 0 && (
            <div className="shrink-0 flex items-center justify-center gap-2 order-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-8 px-3 text-xs shrink-0"
                onClick={() => {
                  setSelectedTransactionIds([]);
                  setIsSelectionMode(false);
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full h-8 px-3 text-xs shrink-0 bg-red-500 hover:bg-red-600 space-x-1"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-3 h-3" />
                <span>Excluir ({selectedTransactionIds.length})</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-sm text-[#9F9FA9]">{t('monthBalance')}</p>
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
                <p className="text-sm text-zinc-400">{t('incomes')}</p>
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
                <p className="text-sm text-zinc-400">{t('expenses')}</p>
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
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-[#2C2C2E] md:flex-1 md:min-h-0 md:flex md:flex-col">
        {/* Mobile List View */}
        <div className="md:hidden p-4 space-y-6">
          {filteredTransactions.map((t, index) => {
            const prevT = filteredTransactions[index - 1];
            const isNewDate = !prevT || prevT.date !== t.date;
            const category = getCategory(t.categoryId);
            const Icon = category ? iconMap[category.icon || 'tag'] || Tag : Tag;
            
            return (
              <React.Fragment key={t.id}>
                {isNewDate && (
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2 flex items-center justify-between">
                    <span>
                      {format(parseISO(t.date), "EEEE, dd", { locale: ptBR }).split('-')[0].charAt(0).toUpperCase() + format(parseISO(t.date), "EEEE, dd", { locale: ptBR }).split('-')[0].slice(1)}
                    </span>
                    <span className="text-sm font-medium text-zinc-500">
                      {formatCurrency(dailyBalances[t.date] || 0)}
                    </span>
                  </h3>
                )}
                <div 
                  className="flex items-center gap-4 p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-zinc-100 dark:border-[#2C2C2E] mb-4"
                  onClick={() => setSelectedTransaction({ ...t, category })}
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", t.type === 'income' ? 'bg-[#01bfa5]/10 text-[#01bfa5]' : 'bg-[#ee5350]/10 text-[#ee5350]')}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.description}</p>
                    <p className="text-sm text-zinc-500">{category?.name || 'Sem categoria'} | {t.type === 'income' ? 'Receita' : 'Despesa'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className={cn("font-bold text-sm", t.type === 'income' ? 'text-[#01bfa5]' : 'text-[#ee5350]')}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
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
        <div className="hidden md:block overflow-x-auto md:overflow-auto md:flex-1">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-[#2C2C2E] border-b border-zinc-200 dark:border-zinc-800 md:sticky md:top-0 z-20">
              <tr>
                {isSelectionMode && (
                  <th className="px-6 py-4 font-medium w-12">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                        checked={selectedTransactionIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={toggleAllSelection}
                      />
                    </div>
                  </th>
                )}
                <th 
                  className="px-6 py-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-center"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('status')}
                    {sortBy === 'status' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-center"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('date')}
                    {sortBy === 'date' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-center"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('description')}
                    {sortBy === 'description' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-center"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('category')}
                    {sortBy === 'category' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-center"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {sortBy === 'amount' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    {t('value')}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.map((t, index) => {
                const category = getCategory(t.categoryId);
                const nextT = filteredTransactions[index + 1];
                const isLastOfDate = !nextT || nextT.date !== t.date;
                return (
                  <React.Fragment key={t.id}>
                    <tr 
                      className={cn(
                        "transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                        selectedTransactionIds.includes(t.id) && "bg-purple-50 dark:bg-purple-900/20"
                      )}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelection(t.id, { stopPropagation: () => {} } as any);
                        } else {
                          setSelectedTransaction({ ...t, category });
                        }
                      }}
                    >
                      {isSelectionMode && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                              checked={selectedTransactionIds.includes(t.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelection(t.id, e as any);
                              }}
                            />
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => handleToggleStatus(t.id, t.status, e)}
                            className="focus:outline-none"
                            title={t.status === 'paid' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                          >
                            {t.status === 'paid' ? (
                              <CheckCircle2 className="w-5 h-5 text-[#01bfa5]" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </button>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger>
                                <span 
                                  className={cn(
                                    "flex items-center justify-center p-1.5 rounded-md transition-all cursor-pointer border",
                                    t.ignored 
                                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10" 
                                      : "bg-transparent border-transparent text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  )}
                                  onClick={(e) => { e.stopPropagation(); updateTransaction(t.id, { ignored: !t.ignored }); }}
                                >
                                  <FileX className="w-[18px] h-[18px]" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] bg-zinc-900 text-white border-zinc-800 text-xs p-3 relative z-50">
                                {t.ignored ? (
                                  <p>Restaurar transação ignorada. Ao desativar, ela voltará a ser exibida nos seus totais.</p>
                                ) : (
                                  <p>Ignorar transação. Ao ativar essa funcionalidade, sua transação não será exibida ou considerada em seus totais de despesas e receitas, gráficos, desempenho e planejamento mensal. Não se preocupe, você poderá desativá-la quando quiser.</p>
                                )}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {format(parseISO(t.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                          {t.description}
                        </div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.tags.map(tagId => {
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
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge category={category} />
                      </td>
                      <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${t.type === 'income' ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} title="Mais opções" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground">
                            <MoreVertical className="w-4 h-4 text-zinc-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransactionId(t.id);
                              setIsNewDialogOpen(true);
                            }} className="flex items-center gap-2 cursor-pointer">
                              <Edit2 className="w-4 h-4 text-zinc-500" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(t.id, t.status, e as any);
                            }} className="flex items-center gap-2 cursor-pointer">
                              {t.status === 'paid' ? <Circle className="w-4 h-4 text-zinc-500" /> : <CheckCircle2 className="w-4 h-4 text-[#01bfa5]" />}
                              Marcar como {t.status === 'paid' ? 'Pendente' : 'Pago'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 flex items-center gap-2 cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id, e as any);
                            }}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    {isLastOfDate && (
                      <tr className="bg-purple-500/5 dark:bg-purple-500/10 border-b border-zinc-100 dark:border-zinc-800/50">
                        <td colSpan={isSelectionMode ? 5 : 4} className="px-6 py-3 text-zinc-500 dark:text-zinc-400 italic text-xs tracking-wider">
                          Saldo do Final do Dia
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-500 dark:text-zinc-400 text-sm">
                          {formatCurrency(dailyBalances[t.date])}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </React.Fragment>
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
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#2C2C2E] border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-zinc-900 dark:text-white">{t('transactionDetails')}</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedTransaction.type === 'income' ? 'bg-[#01bfa5]/10 text-[#01bfa5] dark:bg-[#01bfa5]/20' : 'bg-[#ee5350]/10 text-[#ee5350] dark:bg-[#ee5350]/20'}`}>
                    {selectedTransaction.type === 'income' ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                  </div>
                  <h2 className={`text-2xl font-bold whitespace-nowrap ${selectedTransaction.type === 'income' ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-center">{selectedTransaction.description}</p>
                </div>

                <div className="space-y-4 bg-zinc-50 dark:bg-[#1C1C1E] p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('date')}</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{format(parseISO(selectedTransaction.date), "dd 'de' MMMM 'de' yyyy", { locale: userSettings.language === 'en' ? enUS : userSettings.language === 'es' ? es : ptBR })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('category')}</span>
                    <CategoryBadge category={selectedTransaction.category} />
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
                  {selectedTransaction.observation && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Observação</span>
                      <span className="font-medium text-zinc-900 dark:text-white text-sm text-right break-words max-w-[60%]">{selectedTransaction.observation}</span>
                    </div>
                  )}
                  {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Tags</span>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {selectedTransaction.tags.map(tagId => {
                          const tag = getTag(tagId);
                          if (!tag) return null;
                          const Icon = iconMap[tag.icon || 'tag'] || Tag;
                          return (
                            <div key={tag.id} className="flex items-center gap-2 ml-1">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              >
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-sm font-bold text-zinc-800 dark:text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                {tag.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {(() => {
                  if (!selectedTransaction?.description) return null;
                  const searchDesc = selectedTransaction.description.trim().toLowerCase();
                  // Get more history for the chart
                  const fullHistory = transactions.filter(t => 
                    t.description && 
                    t.description.trim().toLowerCase() === searchDesc
                  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  
                  const historyForList = [...fullHistory].reverse().filter(t => t.id !== selectedTransaction.id).slice(0, 3);
                  
                  if (fullHistory.length > 1) {
                    const chartData = fullHistory.map(h => ({
                      date: format(parseISO(h.date), 'MMM', { locale: ptBR }),
                      amount: h.amount,
                      fullDate: h.date
                    })).slice(-6); // Last 6 occurrences

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center gap-4">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate flex-1" title={selectedTransaction.description}>
                            Histórico de "{selectedTransaction.description}"
                          </h4>
                          {fullHistory.length > 2 && (
                            <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Evolução
                            </span>
                          )}
                        </div>

                        {fullHistory.length > 2 && (
                          <div className="h-[100px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                  </linearGradient>
                                </defs>
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fill: '#9F9FA9' }}
                                  dy={10}
                                />
                                <RechartsTooltip 
                                  cursor={{ fill: 'transparent' }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="bg-white dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl text-xs">
                                          <p className="font-bold">{formatCurrency(payload[0].value as number)}</p>
                                          <p className="text-zinc-500">{payload[0].payload.date}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar 
                                  dataKey="amount" 
                                  fill="url(#barGradient)"
                                  radius={[4, 4, 0, 0]}
                                  barSize={25}
                                  isAnimationActive={true}
                                  animationDuration={1500}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        
                        {historyForList.length > 0 && (
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                            {historyForList.map(ht => {
                              const diff = selectedTransaction.amount - ht.amount;
                              const perc = ht.amount > 0 ? (diff / ht.amount) * 100 : 0;
                              return (
                                <div key={ht.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors">
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
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <DialogFooter className="p-6 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-row gap-3">
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
              </DialogFooter>
            </>
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

      {/* Container Oculto para exportação PDF */}
      <div 
        id="pdf-report-root"
        style={{ 
          position: 'absolute',
          top: '-15000px',
          left: '0px',
          width: '1100px', 
          zIndex: -9999
        }}
      >
        <div 
          id="pdf-report-charts" 
          style={{ 
            width: '1100px',
            backgroundColor: '#f8fafc',
            color: '#18181b',
            position: 'relative',
            padding: '40px'
          }}
        >
          <div className="space-y-12">
            {expensesData.length > 0 ? (
              <>
                {/* 1. ROW: Pie Chart */}
                <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', display: 'flex', gap: '48px', alignItems: 'center' }}>
                  <div style={{ width: '400px', height: '400px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#18181b' }}>{currencyFormatter.format(totalExpense)}</span>
                        <span style={{ fontSize: '14px', color: '#71717a' }}>Total</span>
                    </div>
                    <PieChart width={400} height={400}>
                      <Pie
                        data={expensesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={110}
                        outerRadius={160}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {expensesData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b', marginBottom: '8px' }}>Despesas Por Categorias</h3>
                    {expensesData.map((item: any, i: number) => {
                       const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(2) : '0';
                       return (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                                    {item.name.charAt(0)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#18181b' }}>{item.name}</span>
                                    <span style={{ fontSize: '13px', color: '#71717a' }}>Porcentagem</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: '600', fontSize: '15px', color: '#ef4444' }}>{currencyFormatter.format(item.value)}</span>
                                {userSettings.showValues && <span style={{ fontSize: '13px', color: '#71717a' }}>{percentage}%</span>}
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>

                {/* 2. ROW: Line Chart */}
                <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', display: 'flex', gap: '48px', alignItems: 'center' }}>
                  <div style={{ width: '400px', height: '400px' }}>
                    <LineChart width={400} height={400} data={expensesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => currencyFormatter.format(value)} 
                        width={80}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b', marginBottom: '8px' }}>Despesas Por Categorias</h3>
                    {expensesData.map((item: any, i: number) => {
                       const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(2) : '0';
                       return (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                                    {item.name.charAt(0)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#18181b' }}>{item.name}</span>
                                    <span style={{ fontSize: '13px', color: '#71717a' }}>Porcentagem</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: '600', fontSize: '15px', color: '#ef4444' }}>{currencyFormatter.format(item.value)}</span>
                                {userSettings.showValues && <span style={{ fontSize: '13px', color: '#71717a' }}>{percentage}%</span>}
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>

                {/* 3. ROW: Bar Chart */}
                <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', display: 'flex', gap: '48px', alignItems: 'center' }}>
                  <div style={{ width: '400px', height: '400px' }}>
                    <BarChart width={400} height={400} data={expensesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => currencyFormatter.format(value)} 
                        width={80}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {expensesData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#18181b', marginBottom: '8px' }}>Despesas Por Categorias</h3>
                    {expensesData.map((item: any, i: number) => {
                       const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(2) : '0';
                       return (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                                    {item.name.charAt(0)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#18181b' }}>{item.name}</span>
                                    <span style={{ fontSize: '13px', color: '#71717a' }}>Porcentagem</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: '600', fontSize: '15px', color: '#ef4444' }}>{currencyFormatter.format(item.value)}</span>
                                {userSettings.showValues && <span style={{ fontSize: '13px', color: '#71717a' }}>{percentage}%</span>}
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-zinc-500 py-20 text-xl font-medium">
                Sem dados suficientes no mês para gerar gráficos.
              </div>
            )}
          </div>
        </div>
      </div>
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
