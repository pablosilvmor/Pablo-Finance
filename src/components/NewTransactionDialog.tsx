import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Transaction } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Sparkles, Loader2, Calculator, Check, Tag } from 'lucide-react';
import { autoCategorizeTransaction } from '../lib/gemini';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parseISO, isSameMonth, isSameYear } from 'date-fns';
import { NumericFormat } from 'react-number-format';
import { CalculatorDialog } from './CalculatorDialog';

import { TransactionMenuOverlay } from './TransactionMenuOverlay';

export const NewTransactionDialog = ({ 
  open: externalOpen, 
  onOpenChange: setExternalOpen,
  initialDate,
  transactionId,
  initialType
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
  initialDate?: string;
  transactionId?: string;
  initialType?: 'expense' | 'income';
}) => {
  const { addTransaction, updateTransaction, bulkUpdateTransactions, bulkUpsertTransactions, upsertTransaction, findTransaction, transactions, categories, addCategory, tags: storeTags, addTag } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const [type, setType] = useState<'expense' | 'income'>(initialType || 'expense');

  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType, open]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'paid' | 'pending'>('pending');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!transactionId && type === 'expense') {
      const selectedDate = new Date(date + 'T12:00:00');
      const today = new Date();
      
      // Current month and year
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Selected month and year
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      
      // A month is "past" only if it's before the current month of the current year
      const isPastMonth = (selectedYear < currentYear) || (selectedYear === currentYear && selectedMonth < currentMonth);
      
      if (isPastMonth) {
        setStatus('paid');
      } else {
        setStatus('pending');
      }
    }
  }, [type, date, transactionId]);

  useEffect(() => {
    if (transactionId) {
      const t = transactions.find(trans => trans.id === transactionId);
      if (t) {
        setType(t.type as 'expense' | 'income');
        setAmount(t.amount.toString());
        setDescription(t.description);
        setCategoryId(t.categoryId);
        setDate(parseISO(t.date).toISOString().split('T')[0]);
        setStatus(t.status);
        setSelectedTags(t.tags || []);
        setIsFixed(t.isFixed || false);
        setRepeatPrevious(false);
        setRepeatFuture(false);
      }
    } else if (!open) {
      // Reset for new transaction when closing
      setType('expense');
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStatus('paid');
      setSelectedTags([]);
      setIsFixed(false);
      setRepeatPrevious(false);
      setRepeatFuture(false);
    }
  }, [transactionId, transactions, initialDate, open]);

  useEffect(() => {
    if (initialDate && !transactionId) {
      setDate(initialDate);
    }
  }, [initialDate, transactionId]);

  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  
  const [isFixed, setIsFixed] = useState(false);
  const [repeatPrevious, setRepeatPrevious] = useState(false);
  const [repeatFuture, setRepeatFuture] = useState(false);

  // Calculator state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // New Category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');

  // New Tag state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8B5CF6');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);

  const handleDescriptionBlur = async () => {
    if (!description || !amount || categoryId || transactionId) return;
    
    setIsAutoCategorizing(true);
    // Use the last 50 transactions to learn from user's manual inputs
    const recentTransactions = transactions.slice(-50);
    const suggestedCategoryId = await autoCategorizeTransaction(description, parseFloat(amount), categories, recentTransactions);
    setIsAutoCategorizing(false);

    if (suggestedCategoryId) {
      setCategoryId(suggestedCategoryId);
      const cat = categories.find(c => c.id === suggestedCategoryId);
      if (cat) {
        toast.success(`Categoria "${cat.name}" sugerida por IA!`, {
          icon: <Sparkles className="w-4 h-4 text-purple-600" />
        });
      }
    }
  };

  const handleQuickAddCategory = () => {
    if (!newCatName) return;
    
    const exists = categories.some(c => 
      c.name.toLowerCase() === newCatName.toLowerCase() && c.type === type
    );

    if (exists) {
      toast.error(`A categoria "${newCatName}" já existe para este tipo.`);
      return;
    }

    // We don't pass ID because addCategory handles it via Omit<Category, 'id'>
    addCategory({
      name: newCatName,
      icon: 'tag',
      color: newCatColor,
      type
    });
    // Since we don't know the generated ID immediately, we might need a way to select it.
    // For now, let's just close the adding state.
    setIsAddingCategory(false);
    setNewCatName('');
    toast.success('Categoria criada! Selecione-a na lista.');
  };

  const handleQuickAddTag = () => {
    if (!newTagName) return;
    
    const exists = storeTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase());
    if (exists) {
      toast.error(`A tag "${newTagName}" já existe.`);
      return;
    }

    addTag({
      name: newTagName,
      color: newTagColor,
      icon: 'tag'
    });
    
    setIsAddingTag(false);
    setNewTagName('');
    toast.success('Tag criada! Você já pode selecioná-la.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Informe o valor da transação.');
      return;
    }
    if (!description) {
      toast.error('Informe a descrição da transação.');
      return;
    }
    if (!categoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }
    if (!date) {
      toast.error('Informe a data da transação.');
      return;
    }

    try {
      setIsSubmitting(true);
      const originalGroupId = transactionId ? transactions.find(t => t.id === transactionId)?.groupId : undefined;
      const groupId = transactionId 
        ? (originalGroupId || Math.random().toString(36).substr(2, 9))
        : (isFixed ? Math.random().toString(36).substr(2, 9) : undefined);

      const baseTransaction: any = {
        type,
        amount: parseFloat(amount.replace(',', '.')),
        description,
        categoryId,
        status,
        isFixed,
        tags: selectedTags,
        date: new Date(date + 'T12:00:00').toISOString()
      };

      if (groupId) {
        baseTransaction.groupId = groupId;
      }

      if (transactionId) {
        const previousTransaction = transactions.find(t => t.id === transactionId);
        updateTransaction(transactionId, baseTransaction).catch(e => console.error(e));
        
        if (isFixed && groupId && (repeatFuture || repeatPrevious)) {
          const transactionsToUpsert: any[] = [];
          const baseDateObj = new Date(date + 'T12:00:00');
          
          const startI = repeatPrevious ? -24 : (repeatFuture ? 1 : 0);
          const endI = repeatFuture ? 60 : (repeatPrevious ? -1 : 0);

          for (let i = startI; i <= endI; i++) {
            if (i === 0) continue; // Skip current month as it's already updated
            
            const d = new Date(baseDateObj);
            d.setMonth(d.getMonth() + i);
            
            const isFuture = d > new Date();
            const statusToUse = isFuture ? 'pending' : baseTransaction.status;
            
            // Find existing by groupId first, or fallback to description/category/type
            let existing = transactions.find(t => {
              const sameMonth = isSameMonth(new Date(t.date), d) && isSameYear(new Date(t.date), d);
              if (!sameMonth) return false;
              if (originalGroupId && t.groupId === originalGroupId) return true;
              if (t.description === previousTransaction?.description && 
                  t.categoryId === previousTransaction?.categoryId && 
                  t.type === previousTransaction?.type) return true;
              return false;
            });

            if (existing) {
              transactionsToUpsert.push({ 
                ...existing, 
                ...baseTransaction, 
                status: existing.status, // Keep existing status
                date: existing.date, // Keep existing date
                id: existing.id 
              });
            } else {
              const id = Math.random().toString(36).substr(2, 9);
              transactionsToUpsert.push({ 
                ...baseTransaction, 
                status: statusToUse, 
                date: d.toISOString(), 
                id 
              });
            }
          }

          if (transactionsToUpsert.length > 0) {
            bulkUpsertTransactions(transactionsToUpsert).catch(e => console.error(e));
            toast.success('Série de transações atualizada com sucesso!');
          } else {
            toast.success('Transação atualizada com sucesso!');
          }
        } else {
          toast.success('Transação atualizada com sucesso!', {
            action: {
              label: 'Desfazer',
              onClick: () => {
                if (previousTransaction) {
                  updateTransaction(transactionId, previousTransaction);
                }
              }
            }
          });
        }
      } else {
        const transactionsToUpsert: any[] = [];
        
        // If fixed and repeatPrevious is true, generate for past 3 months as an example
        if (isFixed && repeatPrevious) {
          const baseDate = new Date(date + 'T12:00:00');
          for (let i = -3; i <= 60; i++) {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + i);
            const isFuture = d > new Date();
            const statusToUse = isFuture ? 'pending' : baseTransaction.status;
            const existing = findTransaction(description, categoryId, type, d.toISOString(), groupId);
            
            if (existing) {
              transactionsToUpsert.push({ ...existing, ...baseTransaction, status: statusToUse, id: existing.id, date: d.toISOString() });
            } else {
              const id = Math.random().toString(36).substr(2, 9);
              transactionsToUpsert.push({ ...baseTransaction, status: statusToUse, date: d.toISOString(), id });
            }
          }
          bulkUpsertTransactions(transactionsToUpsert).catch(e => console.error(e));
          toast.success('Transações fixas geradas para os meses anteriores e futuros!');
        } else if (isFixed) {
          // Just generate for future 60 months
          const baseDate = new Date(date + 'T12:00:00');
          // Ensure we start from the month of the base date
          for (let i = 0; i <= 60; i++) {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + i);
            
            const isFuture = d > new Date();
            const statusToUse = isFuture ? 'pending' : baseTransaction.status;
            
            const existing = findTransaction(description, categoryId, type, d.toISOString(), groupId);
            if (existing) {
              transactionsToUpsert.push({ ...existing, ...baseTransaction, status: statusToUse, id: existing.id, date: d.toISOString() });
            } else {
              const id = Math.random().toString(36).substr(2, 9);
              transactionsToUpsert.push({ ...baseTransaction, status: statusToUse, date: d.toISOString(), id });
            }
          }
          bulkUpsertTransactions(transactionsToUpsert).catch(e => console.error(e));
          toast.success('Transação fixa gerada para os próximos meses!');
        } else {
          addTransaction(baseTransaction).catch(e => console.error(e));
          toast.success('Transação adicionada com sucesso!');
        }
      }

      if (!keepOpen) {
        setOpen(false);
      }
      
      // Reset form (if keepOpen is true, only reset amount and description)
      if (!transactionId) {
        setAmount('');
        setDescription('');
        if (!keepOpen) {
          setCategoryId('');
          setSelectedTags([]);
          setIsFixed(false);
          setRepeatPrevious(false);
          setRepeatFuture(false);
        } else {
          toast.success('Pronto para o próximo lançamento!');
        }
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuSelect = (selectedType: 'expense' | 'income' | 'piggy-bank') => {
    setIsMenuOpen(false);
    if (selectedType === 'expense' || selectedType === 'income') {
      setType(selectedType);
      setOpen(true);
    } else {
      toast.info('Funcionalidade em desenvolvimento');
    }
  };

  return (
    <>
      {!transactionId && externalOpen === undefined && (
        <Button 
          variant="default" 
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-9 px-4"
          onClick={() => setIsMenuOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      )}

      <TransactionMenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={handleMenuSelect} 
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transactionId ? 'Editar Transação' : 'Adicionar Transação'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Button 
            variant={type === 'expense' ? 'default' : 'outline'} 
            className={type === 'expense' ? 'bg-red-600 hover:bg-red-700 flex-1 text-white' : 'flex-1'}
            onClick={() => setType('expense')}
          >
            Despesa
          </Button>
          <Button 
            variant={type === 'income' ? 'default' : 'outline'} 
            className={type === 'income' ? 'bg-green-600 hover:bg-green-700 flex-1 text-white' : 'flex-1'}
            onClick={() => setType('income')}
          >
            Receita
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <div className="flex gap-2">
              <NumericFormat
                id="amount"
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                placeholder="R$ 0,00"
                value={amount}
                onValueChange={(values) => setAmount(values.value)}
                className="flex-1"
                required
              />
              <Button 
                variant="outline" 
                size="icon" 
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
              >
                <Calculator className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CalculatorDialog 
            open={isCalculatorOpen}
            onOpenChange={setIsCalculatorOpen}
            initialValue={parseFloat(amount) || 0}
            onConfirm={(val) => setAmount(val.toString())}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <div className="relative">
              <Input 
                id="description" 
                placeholder="Ex: Supermercado" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                required
              />
              {isAutoCategorizing && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> A IA tentará categorizar automaticamente ao preencher.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Categoria</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-purple-600 hover:text-purple-700"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
              >
                {isAddingCategory ? 'Cancelar' : '+ Nova'}
              </Button>
            </div>
            
            {isAddingCategory ? (
              <div className="flex gap-2 p-2 border border-dashed border-purple-300 rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
                <Input 
                  placeholder="Nome da categoria" 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input 
                  type="color" 
                  value={newCatColor} 
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-8 p-1"
                />
                <Button type="button" size="sm" className="h-8" onClick={handleQuickAddCategory}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue>
                    {categoryId ? (
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color }} 
                        />
                        {categories.find(c => c.id === categoryId)?.name}
                      </div>
                    ) : (
                      "Selecione uma categoria"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === type)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-purple-600 hover:text-purple-700"
                onClick={() => setIsAddingTag(!isAddingTag)}
              >
                {isAddingTag ? 'Cancelar' : '+ Nova'}
              </Button>
            </div>
            
            {isAddingTag ? (
              <div className="flex gap-2 p-2 border border-dashed border-purple-300 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 mb-2">
                <Input 
                  placeholder="Nome da tag" 
                  value={newTagName} 
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input 
                  type="color" 
                  value={newTagColor} 
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-8 p-1"
                />
                <Button type="button" size="sm" className="h-8" onClick={handleQuickAddTag}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {storeTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag.id) ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-600' : 'bg-transparent border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    color: selectedTags.includes(tag.id) ? tag.color : 'inherit',
                    borderColor: selectedTags.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  {tag.name}
                </button>
              ))}
              {storeTags.length === 0 && (
                <p className="text-xs text-zinc-500">Nenhuma tag cadastrada. Vá em Ajustes &gt; Tags para criar.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input 
              id="date" 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">{type === 'expense' ? 'Despesa Fixa' : 'Receita Fixa'}</Label>
              <p className="text-xs text-zinc-500">Repetir todos os meses</p>
            </div>
            <Switch checked={isFixed} onCheckedChange={setIsFixed} />
          </div>

          {isFixed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm text-purple-900 dark:text-purple-100">Aplicar aos meses anteriores?</Label>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Gerar histórico retroativo</p>
                </div>
                <Switch checked={repeatPrevious} onCheckedChange={setRepeatPrevious} />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm text-purple-900 dark:text-purple-100">Aplicar aos meses futuros?</Label>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Replicar para os próximos meses</p>
                </div>
                <Switch checked={repeatFuture} onCheckedChange={setRepeatFuture} />
              </div>
            </div>
          )}

          {!transactionId && (
            <div className="flex items-center gap-2 mt-4 pb-2">
              <Checkbox id="keepOpen" checked={keepOpen} onCheckedChange={(checked) => setKeepOpen(!!checked)} />
              <Label htmlFor="keepOpen" className="text-xs text-muted-foreground">Manter dados na tela para novo lançamento</Label>
            </div>
          )}

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : transactionId ? 'Atualizar' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
};
