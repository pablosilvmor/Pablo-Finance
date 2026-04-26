import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Filter, X, ChevronDown, Calendar, Check, Tag as TagIcon, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Category, Tag, TransactionStatus } from '../types';
import { PiggyBankEntry } from '../lib/store';
import { iconMap } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface TransactionFilterDialogProps {
  onApply: (filters: FilterConfig) => void;
  categories: Category[];
  tags: Tag[];
  accounts: PiggyBankEntry[];
  currentFilters: FilterConfig;
}

export interface FilterConfig {
  startDate: Date;
  endDate: Date;
  categories: string[];
  tags: string[];
  accounts: string[];
  statuses: string[];
  type: 'all' | 'income' | 'expense';
}

export const TransactionFilterDialog = ({ 
  onApply, 
  categories, 
  tags, 
  accounts,
  currentFilters 
}: TransactionFilterDialogProps) => {
  const [localFilters, setLocalFilters] = useState<FilterConfig>({ ...currentFilters });
  const [saveFilter, setSaveFilter] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalFilters({ ...currentFilters });
    }
  }, [isOpen, currentFilters]);

  const handleClear = () => {
    setLocalFilters({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      categories: [],
      tags: [],
      accounts: [],
      statuses: [],
      type: 'all'
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    setIsOpen(false);
  };

  const toggleCategory = (id: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(id) 
        ? prev.categories.filter(c => c !== id) 
        : [...prev.categories, id]
    }));
  };

  const toggleStatus = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status) 
        ? prev.statuses.filter(s => s !== status) 
        : [...prev.statuses, status]
    }));
  };

  const toggleTag = (id: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(id) 
        ? prev.tags.filter(t => t !== id) 
        : [...prev.tags, id]
    }));
  };

  const toggleAccount = (id: string) => {
    setLocalFilters(prev => ({
      ...prev,
      accounts: prev.accounts.includes(id) 
        ? prev.accounts.filter(a => a !== id) 
        : [...prev.accounts, id]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          >
            <Filter className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </Button>
        } 
      />
      <DialogContent className="sm:max-w-[450px] bg-[#1C1C1C] text-white border-zinc-800 p-0 overflow-hidden gap-0">
        <div className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-white mb-4">Filtro de transações</DialogTitle>
          
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="bg-transparent border-b border-zinc-800 rounded-none w-full justify-start p-0 h-auto gap-8 mb-6" variant="line">
              <TabsTrigger 
                value="new" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F95F5F] data-[state=active]:text-[#F95F5F] bg-transparent pb-2 px-0 font-bold uppercase tracking-wider text-xs transition-none shadow-none"
              >
                Novo Filtro
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F95F5F] data-[state=active]:text-[#F95F5F] bg-transparent pb-2 px-0 font-bold uppercase tracking-wider text-xs transition-none shadow-none"
              >
                Filtros Salvos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-6 mt-2 pb-6 px-0">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">De</Label>
                  <div className="relative border-b border-zinc-700">
                    <Input 
                      type="date" 
                      value={format(localFilters.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        if (dateStr) {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          setLocalFilters(prev => ({ ...prev, startDate: new Date(year, month - 1, day, 0, 0, 0) }));
                        }
                      }}
                      className="bg-transparent border-none rounded-none p-0 h-8 text-zinc-200 focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">Até</Label>
                  <div className="relative border-b border-zinc-700">
                    <Input 
                      type="date" 
                      value={format(localFilters.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        if (dateStr) {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          setLocalFilters(prev => ({ ...prev, endDate: new Date(year, month - 1, day, 23, 59, 59, 999) }));
                        }
                      }}
                      className="bg-transparent border-none rounded-none p-0 h-8 text-zinc-200 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Categorias */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold">Categorias</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    render={
                      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-700 min-h-10 pb-2 cursor-pointer">
                        {localFilters.categories.length === 0 ? (
                          <span className="text-zinc-400 text-sm">Todas as categorias</span>
                        ) : (
                          localFilters.categories.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            const Icon = iconMap[cat.icon] || FileText;
                            return (
                              <div 
                                key={catId}
                                className="flex items-center gap-2 bg-zinc-800 rounded-full px-3 py-1 text-xs border border-zinc-700"
                              >
                                <Icon className="w-3 h-3" style={{ color: cat.color }} />
                                <span>{cat.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); toggleCategory(catId); }}>
                                  <X className="w-3 h-3 text-red-500 ml-1" />
                                </button>
                              </div>
                            );
                          })
                        )}
                        <ChevronDown className="w-4 h-4 ml-auto text-zinc-600" />
                      </div>
                    } 
                  />
                  <DropdownMenuContent className="bg-[#1C1C1C] border-zinc-800 text-white w-[380px] max-h-60 flex flex-col">
                    <div className="p-2 border-b border-zinc-800 sticky top-0 bg-[#1C1C1C] z-10">
                      <Input
                        placeholder="Buscar categoria..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="h-8 bg-zinc-800 border-zinc-700 text-xs focus-visible:ring-1 focus-visible:ring-zinc-600"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden">
                      {categories
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                        .map(cat => {
                        const Icon = iconMap[cat.icon] || FileText;
                        return (
                          <DropdownMenuCheckboxItem
                            key={cat.id}
                            checked={localFilters.categories.includes(cat.id)}
                            onCheckedChange={() => toggleCategory(cat.id)}
                            className="focus:bg-zinc-800 focus:text-white"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: cat.color }} />
                              <span>{cat.name}</span>
                              <span className={cn("ml-auto text-[8px] uppercase px-1 rounded", cat.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}>
                                {cat.type === 'income' ? 'Receita' : 'Despesa'}
                              </span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold">Tags</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    render={
                      <div className="flex items-center justify-between border-b border-zinc-700 h-10 cursor-pointer">
                        <div className="flex flex-wrap gap-2 py-1">
                          {localFilters.tags.length === 0 ? (
                            <span className="text-zinc-400 text-sm">Todas as tags</span>
                          ) : (
                            localFilters.tags.map(tagId => {
                              const tag = tags.find(t => t.id === tagId);
                              if (!tag) return null;
                              const Icon = iconMap[tag.icon || 'tag'] || TagIcon;
                              return (
                                <div key={tagId} className="bg-zinc-800 rounded-full px-3 py-1 text-xs border border-zinc-700 flex items-center gap-1">
                                  <Icon className="w-3 h-3" style={{ color: tag.color }} />
                                  <span>{tag.name}</span>
                                  <button onClick={(e) => { e.stopPropagation(); toggleTag(tagId); }}>
                                    <X className="w-3 h-3 text-red-400" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-zinc-600" />
                      </div>
                    } 
                  />
                  <DropdownMenuContent className="bg-[#1C1C1C] border-zinc-800 text-white w-[380px] max-h-60 flex flex-col">
                    <div className="p-2 border-b border-zinc-800 sticky top-0 bg-[#1C1C1C] z-10">
                      <Input
                        placeholder="Buscar tag..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="h-8 bg-zinc-800 border-zinc-700 text-xs focus-visible:ring-1 focus-visible:ring-zinc-600"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden">
                      {tags
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map(tag => {
                        const Icon = iconMap[tag.icon || 'tag'] || TagIcon;
                        return (
                          <DropdownMenuCheckboxItem
                            key={tag.id}
                            checked={localFilters.tags.includes(tag.id)}
                            onCheckedChange={() => toggleTag(tag.id)}
                            className="focus:bg-zinc-800 focus:text-white"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: tag.color }} />
                              <span>{tag.name}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Situações */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-[#F95F5F] font-bold">Situações</Label>
                <div className="flex items-center justify-between border-b border-zinc-700 h-10">
                  <div className="flex gap-2">
                    {localFilters.statuses.length === 0 ? (
                      <span className="text-zinc-400 text-sm">Todas as situações</span>
                    ) : (
                      localFilters.statuses.map(status => (
                        <div key={status} className="bg-zinc-800 rounded-full px-3 py-1 text-xs border border-[#F95F5F] flex items-center gap-1">
                          <span>{status === 'paid' ? 'Efetuada' : 'Pendente'}</span>
                          <button onClick={() => toggleStatus(status)}>
                            <X className="w-3 h-3 text-zinc-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {localFilters.statuses.length > 0 && (
                      <button onClick={() => setLocalFilters(prev => ({ ...prev, statuses: [] }))}>
                        <X className="w-4 h-4 text-zinc-500" />
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<ChevronDown className="w-4 h-4 text-zinc-600 cursor-pointer" />} />
                      <DropdownMenuContent className="bg-[#1C1C1C] border-zinc-800 text-white">
                        <DropdownMenuCheckboxItem 
                          checked={localFilters.statuses.includes('paid')} 
                          onCheckedChange={() => toggleStatus('paid')}
                          className="focus:bg-zinc-800 focus:text-white"
                        >
                          Efetuada
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={localFilters.statuses.includes('pending')} 
                          onCheckedChange={() => toggleStatus('pending')}
                          className="focus:bg-zinc-800 focus:text-white"
                        >
                          Pendente
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Salvar Filtro */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-zinc-300">Salvar filtro personalizado</span>
                <Switch 
                  checked={saveFilter} 
                  onCheckedChange={setSaveFilter}
                  className="data-[state=checked]:bg-[#F95F5F]" 
                />
              </div>
            </TabsContent>

            <TabsContent value="saved" className="h-[400px] flex items-center justify-center text-zinc-500">
              Nenhum filtro salvo ainda.
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 pt-4 pb-8 bg-transparent border-t border-zinc-800 flex flex-row items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <DialogClose 
              render={
                <Button variant="ghost" className="text-[#F95F5F] hover:text-[#F95F5F] hover:bg-zinc-800/50 uppercase text-[10px] font-bold transition-colors h-auto px-2">
                  CANCELAR
                </Button>
              } 
            />
            <Button 
              variant="ghost" 
              onClick={handleClear}
              className="text-[#F95F5F] hover:text-[#F95F5F] hover:bg-zinc-800/50 uppercase text-[10px] font-bold transition-colors h-auto px-2"
            >
              LIMPAR FILTROS
            </Button>
          </div>
          <Button 
            onClick={handleApply}
            className="bg-[#F95F5F] hover:bg-[#E54D4D] text-white uppercase text-xs font-bold rounded-full px-8 py-2.5 h-auto"
          >
            APLICAR FILTROS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
