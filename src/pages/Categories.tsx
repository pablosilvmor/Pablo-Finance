import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Maximize2, MoreVertical, Edit2, Archive, FileText, ChevronDown, ChevronUp, Trash2, Download, Upload, BarChart3 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/icons';

export const Categories = () => {
  const { categories, addTransaction, transactions, addCategory, deleteCategory, bulkDeleteCategories, updateCategory } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income'>('expense');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedStatsCategory, setSelectedStatsCategory] = useState<any>(null);
  
  // New/Edit category state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#EF4444');
  const [newIcon, setNewIcon] = useState('file-text');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const filteredCategories = categories
    .filter(c => c.type === typeFilter)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const exists = categories.some(c => 
      c.name.trim().toLowerCase() === newName.trim().toLowerCase() && 
      c.type === typeFilter && 
      (!editingCategory || c.id !== editingCategory.id)
    );

    if (exists) {
      toast.error(`A categoria "${newName}" já existe para este tipo.`);
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: newName.trim(),
        color: newColor,
        icon: newIcon
      });
      toast.success('Categoria atualizada com sucesso!');
    } else {
      addCategory({
        name: newName.trim(),
        type: typeFilter,
        color: newColor,
        icon: newIcon
      });
      toast.success('Categoria criada com sucesso!');
    }

    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewColor('#EF4444');
    setNewIcon('file-text');
    setIsAddOpen(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewColor(category.color);
    setNewIcon(category.icon);
    setIsAddOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setIsSelectionMode(true);
    if (!selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(prev => [...prev, id]);
    }
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete);
      toast.success('Categoria excluída com sucesso!');
      setCategoryToDelete(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCategoryIds.length === 0) return;
    bulkDeleteCategories(selectedCategoryIds).then(() => {
      toast.success(`${selectedCategoryIds.length} ${selectedCategoryIds.length === 1 ? 'categoria excluída' : 'categorias excluídas'}!`);
      setSelectedCategoryIds([]);
      setIsSelectionMode(false);
    }).catch(console.error);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedCategoryIds.length === filteredCategories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(filteredCategories.map(c => c.id));
    }
  };

  const handleExportCategories = () => {
    const dataStr = JSON.stringify(categories, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `categorias_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Categorias exportadas com sucesso!');
  };

  const handleImportCategories = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          let addedCount = 0;
          imported.forEach(cat => {
            const exists = categories.some(c => c.name.toLowerCase() === cat.name.toLowerCase() && c.type === cat.type);
            if (!exists && cat.name && cat.type) {
              addCategory({
                name: cat.name,
                type: cat.type,
                color: cat.color || '#8E8E93',
                icon: cat.icon || 'file-text'
              });
              addedCount++;
            }
          });
          toast.success(`${addedCount} categorias importadas com sucesso!`);
        }
      } catch (err) {
        toast.error('Erro ao importar arquivo. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  const getCategoryStats = (category: any) => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.categoryId === category.id;
    });

    const total = currentMonthTransactions.reduce((acc, t) => acc + t.amount, 0);
    const count = currentMonthTransactions.length;

    return { total, count };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant={typeFilter === 'expense' ? 'default' : 'outline'}
            className={typeFilter === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white rounded-full' : 'rounded-full'}
            onClick={() => setTypeFilter('expense')}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Categoria de Despesas
          </Button>
          <Button 
            variant={typeFilter === 'income' ? 'default' : 'outline'}
            className={typeFilter === 'income' ? 'bg-green-500 hover:bg-green-600 text-white rounded-full' : 'rounded-full'}
            onClick={() => setTypeFilter('income')}
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Categoria de Receitas
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddOpen(open);
          }}>
            <DialogTrigger render={
              <Button variant="outline" size="icon" className="rounded-full bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
                <Plus className="w-4 h-4" />
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ex: Alimentação" />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-16 p-1 h-10" />
                    <Input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                    {Object.entries(iconMap).map(([key, IconComponent]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewIcon(key)}
                        className={`p-2 rounded-md flex items-center justify-center transition-colors ${newIcon === key ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  {editingCategory ? 'Atualizar' : 'Salvar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!selectedStatsCategory} onOpenChange={(open) => !open && setSelectedStatsCategory(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Estatísticas: {selectedStatsCategory?.name}</DialogTitle>
              </DialogHeader>
              {selectedStatsCategory && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Gasto este Mês</p>
                      <p className="text-xl font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getCategoryStats(selectedStatsCategory).total)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Transações</p>
                      <p className="text-xl font-bold text-foreground">
                        {getCategoryStats(selectedStatsCategory).count}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: selectedStatsCategory.color + '20' }}>
                        {React.createElement(iconMap[selectedStatsCategory.icon] || FileText, { 
                          className: "w-5 h-5",
                          style: { color: selectedStatsCategory.color }
                        })}
                      </div>
                      <div>
                        <h4 className="font-bold">{selectedStatsCategory.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{selectedStatsCategory.type === 'expense' ? 'Despesa' : 'Receita'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-sm text-muted-foreground">Esta categoria representa {(getCategoryStats(selectedStatsCategory).total / transactions.filter(t => t.type === selectedStatsCategory.type).reduce((acc, t) => acc + t.amount, 0) * 100 || 0).toFixed(1)}% das suas movimentações de {selectedStatsCategory.type === 'expense' ? 'saída' : 'entrada'} este mês.</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            onClick={() => {
              if (filteredCategories.length > 0) {
                setSelectedStatsCategory(filteredCategories[0]);
              } else {
                toast.error('Crie uma categoria primeiro.');
              }
            }}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border overflow-hidden">
            {isSearchOpen && (
              <div className="relative">
                <Input 
                  placeholder="Buscar..." 
                  className="w-32 h-7 bg-transparent border-none text-xs focus-visible:ring-0 pl-2 pr-6"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7 rounded-full", isSearchOpen && "bg-background shadow-sm")}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-3 h-3" />
            </Button>
          </div>

          {isSelectionMode && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-9 px-4"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedCategoryIds([]);
                }}
              >
                Cancelar
              </Button>
              {selectedCategoryIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-full shrink-0 h-9 px-3 bg-red-500 hover:bg-red-600 gap-2"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:inline">Confirmar ({selectedCategoryIds.length})</span>
                </Button>
              )}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleExportCategories} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Categorias
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 relative">
                <Upload className="w-4 h-4" />
                Importar Categorias
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".json" 
                  onChange={handleImportCategories} 
                />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (filteredCategories.length > 0) setSelectedStatsCategory(filteredCategories[0])
              }} className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Estatísticas Detalhadas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e transações associadas podem ficar sem categoria.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/50 border-b border-border">
              <tr>
                {isSelectionMode && (
                  <th className="px-6 py-4 font-medium w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                      checked={selectedCategoryIds.length === filteredCategories.length && filteredCategories.length > 0}
                      onChange={toggleAllSelection}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Ícone</th>
                <th className="px-6 py-4 font-medium">Cor</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.map((category) => {
                const Icon = iconMap[category.icon] || FileText;
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <tr key={category.id} className={cn("transition-colors group cursor-pointer", isSelected ? "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30" : "hover:bg-secondary/50")} onClick={(e) => isSelectionMode ? toggleSelection(category.id, e) : handleEdit(category)}>
                    {isSelectionMode && (
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-purple-600 focus:ring-purple-500"
                          checked={isSelected}
                          onChange={(e) => toggleSelection(category.id, e as any)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-foreground">
                      {category.name}
                    </td>
                    <td className="px-6 py-4">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        className="w-5 h-5 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setSelectedStatsCategory(category); }}
                          title="Estatísticas"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
