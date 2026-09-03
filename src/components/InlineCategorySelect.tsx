import React from 'react';
import { useAppStore } from '@/lib/store';
import { TransactionType } from '@/types';
import { iconMap } from '@/lib/icons';
import { ChevronDown, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface InlineCategorySelectProps {
  transactionId: string;
  categoryId: string;
  type?: TransactionType;
  onCategoryChange?: (newCategoryId: string) => void;
  className?: string;
}

export const InlineCategorySelect: React.FC<InlineCategorySelectProps> = ({
  transactionId,
  categoryId,
  type,
  onCategoryChange,
  className = '',
}) => {
  const { categories, updateTransaction } = useAppStore();

  const currentCategory = categories.find(c => c.id === categoryId);
  const CurrentIcon = currentCategory ? (iconMap[currentCategory.icon] || FileText) : FileText;

  // Filtrar categorias pertinentes (priorizando o tipo da transação)
  const availableCategories = React.useMemo(() => {
    if (!type || type === 'transfer') {
      return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    }
    const filtered = categories.filter(c => c.type === type);
    // Caso a categoria atual pertença a outro tipo (dado legado), adiciona ela também
    if (currentCategory && !filtered.some(c => c.id === currentCategory.id)) {
      filtered.unshift(currentCategory);
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, type, currentCategory]);

  const handleSelectCategory = (newCatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newCatId === categoryId) return;

    const selectedCategory = categories.find(c => c.id === newCatId);
    updateTransaction(transactionId, { categoryId: newCatId });
    if (onCategoryChange) {
      onCategoryChange(newCatId);
    }
    if (selectedCategory) {
      toast.success(`Categoria alterada para "${selectedCategory.name}"`);
    }
  };

  return (
    <div className={cn("inline-flex items-center", className)} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left group focus:outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              title="Clique para alterar a categoria desta transação"
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-xs" 
                style={{ backgroundColor: currentCategory?.color || '#a1a1aa' }}
              >
                <CurrentIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 max-w-[130px] truncate">
                {currentCategory?.name || 'Sem categoria'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          }
        />
        <DropdownMenuContent 
          align="start" 
          className="max-h-72 overflow-y-auto min-w-[210px] p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl z-50"
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Selecione a Categoria
          </div>
          {availableCategories.map((c) => {
            const Icon = iconMap[c.icon] || FileText;
            const isSelected = c.id === categoryId;

            return (
              <DropdownMenuItem
                key={c.id}
                onClick={(e) => handleSelectCategory(c.id, e)}
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                  isSelected 
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium" 
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: c.color }}
                  >
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="truncate">{c.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
