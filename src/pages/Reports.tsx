import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Filter, PieChart as PieChartIcon, Activity, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthPicker } from '@/components/MonthPicker';

export const Reports = () => {
  const { transactions, categories, tags, userSettings } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportType, setReportType] = useState('expenses');
  const [chartType, setChartType] = useState<'pie' | 'line' | 'bar'>(() => {
    return (localStorage.getItem('preferredChartType') as 'pie' | 'line' | 'bar') || 'pie';
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('preferredChartType', chartType);
  }, [chartType]);

  const formatCurrency = (value: number) => {
    try {
      if (!userSettings?.showValues) {
        const symbol = userSettings?.currency === 'BRL' ? 'R$' : userSettings?.currency === 'USD' ? '$' : '€';
        return `${symbol} •••••`;
      }
      return new Intl.NumberFormat(userSettings?.language || 'pt-BR', { 
        style: 'currency', 
        currency: userSettings?.currency || 'BRL'
      }).format(value);
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
      case 'pie':
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
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid #333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ fontWeight: '500' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
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
                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number, name: string, props: any) => {
                  const total = filteredData.reduce((acc, cur) => acc + cur.value, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  const color = props.payload?.color || props.color;
                  return [
                    <span style={{ color }}>{`${formatCurrency(value)} (${percentage}%)`}</span>,
                    <span style={{ color }}>{name}</span>
                  ];
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid #333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  padding: '12px'
                }}
                itemStyle={{ fontWeight: '600' }}
                cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
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
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid #333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ fontWeight: '500' }}
              />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Relatórios</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 ${chartType === 'pie' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartType('pie')}
          >
            <PieChartIcon className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 ${chartType === 'line' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartType('line')}
          >
            <Activity className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 ${chartType === 'bar' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px] md:w-[220px] rounded-full bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione o relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expenses">Despesas por categorias</SelectItem>
              <SelectItem value="incomes">Receitas por categorias</SelectItem>
              <SelectItem value="tags_expense">Despesas por tags</SelectItem>
              <SelectItem value="tags_income">Receitas por tags</SelectItem>
            </SelectContent>
          </Select>
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
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        <span className="text-xs font-bold">{category.name.substring(0, 1)}</span>
                      </div>
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
