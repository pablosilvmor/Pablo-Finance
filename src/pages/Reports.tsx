import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Filter, PieChart as PieChartIcon, Activity, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthPicker } from '@/components/MonthPicker';
import { CategoryBadge } from '@/components/CategoryBadge';

export const Reports = () => {
  const location = useLocation();
  const { activeTransactions: allTransactions, costCenters, categories, tags, userSettings, viewDate: currentDate, setViewDate: setCurrentDate } = useAppStore();
  
  const initialData = location.state as { tab?: string } | null;
  const initialReportType = initialData?.tab === 'tags' ? 'tags_expense' : 'expenses';

  const [reportType, setReportType] = useState(initialReportType);
  const [chartType, setChartType] = useState<'distribution' | 'line' | 'bar' | 'pie'>(() => {
    return (localStorage.getItem('preferredChartType') as 'distribution' | 'line' | 'bar' | 'pie') || 'distribution';
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('all');

  const transactions = useMemo(() => {
    if (selectedCostCenterId === 'all') return allTransactions;
    return allTransactions.filter(t => t.costCenterId === selectedCostCenterId);
  }, [allTransactions, selectedCostCenterId]);

  useEffect(() => {
    localStorage.setItem('preferredChartType', chartType);
  }, [chartType]);

  const formatCurrency = (value: number) => {
    try {
      if (!userSettings?.showValues) {
        const symbol = userSettings?.currency === 'BRL' ? 'R$' : userSettings?.currency === 'USD' ? '$' : '€';
        return `${symbol} •••••`;
      }
      // Prevent -R$ 0,00 by normalizing values very close to zero
      const normalizedVal = Math.abs(value) < 0.005 ? 0 : value;
      return new Intl.NumberFormat(userSettings?.language || 'pt-BR', { 
        style: 'currency', 
        currency: userSettings?.currency || 'BRL'
      }).format(normalizedVal);
    } catch (e) {
      return value.toString();
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const filteredData = useMemo(() => {
    const isIncome = reportType === 'incomes' || reportType === 'tags_income';
    const type = isIncome ? 'income' : 'expense';
    const isTagReport = reportType.startsWith('tags_');
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === type && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    if (isTagReport) {
      const tagTotals = filteredTransactions.reduce((acc, curr) => {
        if (curr.tags && curr.tags.length > 0) {
          curr.tags.forEach(tagId => {
            acc[tagId] = (acc[tagId] || 0) + curr.amount; // Simple allocation: full amount to each tag. Alternatively could divide by tag count.
          });
        } else {
          acc['sem_tag'] = (acc['sem_tag'] || 0) + curr.amount;
        }
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(tagTotals).reduce((sum, val) => sum + val, 0);

      const tagsList = tags || [];
      return Object.entries(tagTotals)
        .map(([tagId, amount]) => {
          const tag = tagsList.find(t => t.id === tagId);
          return {
            name: tagId === 'sem_tag' ? 'Sem Tag' : (tag?.name || 'Desconhecido'),
            value: amount,
            color: tagId === 'sem_tag' ? '#9CA3AF' : (tag?.color || '#ccc'),
            icon: tagId === 'sem_tag' ? 'tag' : (tag?.icon || 'tag'),
            percentage: total > 0 ? ((amount / total) * 100).toFixed(2) : '0.00'
          };
        })
        .sort((a, b) => b.value - a.value);
    } else {
      const categoryTotals = filteredTransactions.reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

      return Object.entries(categoryTotals)
        .map(([categoryId, amount]) => {
          const category = categories.find(c => c.id === categoryId);
          return {
            name: category?.name || 'Desconhecido',
            value: amount,
            color: category?.color || '#ccc',
            icon: category?.icon || 'file-text',
            percentage: total > 0 ? ((amount / total) * 100).toFixed(2) : '0.00'
          };
        })
        .sort((a, b) => b.value - a.value);
    }
  }, [transactions, categories, tags, currentDate, reportType]);

  const totalAmount = filteredData.reduce((sum, item) => sum + item.value, 0);

  const handleExportCSV = () => {
    const headers = ['Categoria', 'Valor', 'Porcentagem'];
    const rows = filteredData.map(item => {
      const percentage = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : '0.0';
      return [
        `"${item.name}"`,
        item.value.toString().replace('.', ','),
        `${percentage}%`
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${reportType}_${format(currentDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChart = () => {
    if (filteredData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-zinc-500">
          Nenhum dado para exibir neste período.
        </div>
      );
    }

    switch (chartType) {
      case 'distribution':
        if (filteredData.length > 5) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => userSettings.showValues ? new Intl.NumberFormat(userSettings.language, { style: 'currency', currency: userSettings.currency, maximumFractionDigits: 0 }).format(value) : '•••••'} 
                />
                <Tooltip 
                  trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const value = payload[0].value as number;
                      const total = filteredData.reduce((acc, cur) => acc + cur.value, 0);
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        } else {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const value = payload[0].value as number;
                      const total = filteredData.reduce((acc, cur) => acc + cur.value, 0);
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
          );
        }
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => userSettings.showValues ? new Intl.NumberFormat(userSettings.language, { style: 'currency', currency: userSettings.currency, maximumFractionDigits: 0 }).format(value) : '•••••'} 
              />
              <Tooltip 
                trigger={typeof window !== 'undefined' && window.innerWidth < 768 ? 'click' : 'hover'}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const value = payload[0].value as number;
                    const total = filteredData.reduce((acc, cur) => acc + cur.value, 0);
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
                        <p style={{ color: data.color || '#8b5cf6', fontWeight: '500', margin: 0, fontSize: '14px' }}>
                          {formatCurrency(value)} {userSettings.showValues ? `(${percentage}%)` : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Relatórios</h1>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 ${chartType === 'distribution' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartType('distribution')}
          >
            {filteredData.length > 5 ? <BarChart3 className="w-4 h-4" /> : <PieChartIcon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 ${chartType === 'line' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartType('line')}
          >
            <Activity className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* View Type Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-full">
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${!reportType.includes('tags') ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
              onClick={() => setReportType(reportType.includes('expense') ? 'expenses' : 'incomes')}
            >
              Categorias
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${reportType.includes('tags') ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
              onClick={() => setReportType(reportType.includes('expense') ? 'tags_expense' : 'tags_income')}
            >
              Tags
            </button>
          </div>
          
          {/* Data Type Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-full">
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${reportType.includes('expense') ? 'bg-white dark:bg-zinc-800 text-[#ee5350] shadow-sm' : 'text-zinc-500 hover:text-[#ee5350]'}`}
              onClick={() => setReportType(reportType.includes('tags') ? 'tags_expense' : 'expenses')}
            >
              Despesas
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${reportType.includes('income') ? 'bg-white dark:bg-zinc-800 text-[#01bfa5] shadow-sm' : 'text-zinc-500 hover:text-[#01bfa5]'}`}
              onClick={() => setReportType(reportType.includes('tags') ? 'tags_income' : 'incomes')}
            >
              Receitas
            </button>
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-8 w-8 ml-auto sm:ml-1 shrink-0"
            onClick={handleExportCSV}
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <button 
              onClick={() => setIsMonthPickerOpen(true)}
              className="px-6 py-2 rounded-full border border-primary/30 text-primary font-medium text-sm capitalize hover:bg-primary/5 transition-colors"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <MonthPicker 
            open={isMonthPickerOpen}
            onOpenChange={setIsMonthPickerOpen}
            selectedDate={currentDate}
            onSelect={setCurrentDate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="h-[250px] md:h-[300px] relative flex items-center justify-center">
              {renderChart()}
              {chartType === 'pie' && filteredData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {userSettings.showValues ? formatCurrency(totalAmount) : '•••••'}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Total</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 capitalize">
                {reportType.includes('expense') ? 'Despesas' : 'Receitas'} por {reportType.startsWith('tags_') ? 'tags' : 'categorias'}
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {filteredData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CategoryBadge 
                        category={{ 
                          id: category.name, 
                          name: category.name, 
                          color: category.color, 
                          icon: (category as any).icon || 'tag', 
                          type: 'expense' 
                        }} 
                        circleClassName="w-10 h-10"
                        iconClassName="w-5 h-5 text-white"
                        hideName={true}
                      />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{category.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Porcentagem</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${reportType === 'expenses' ? 'text-red-500' : 'text-green-500'}`}>
                        {userSettings.showValues ? formatCurrency(category.value) : '•••••'}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{userSettings.showValues ? `${category.percentage}%` : '••%'}</p>
                    </div>
                  </div>
                ))}
                
                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    Nenhum dado neste período.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
