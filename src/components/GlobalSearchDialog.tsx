import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, X, MessageSquare, Database, HelpCircle, Loader2 } from 'lucide-react';
import { searchSystem } from '@/lib/gemini';
import { useAppStore } from '@/lib/store';
import Markdown from 'react-markdown';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const store = useAppStore();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await searchSystem(query, {
        transactions: store.transactions,
        categories: store.categories,
        goals: store.goals,
        userSettings: store.userSettings
      });
      setResult(response);
    } catch (error) {
      setResult("Ocorreu um erro ao processar sua busca.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResult(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <div className="bg-white dark:bg-[#1C1C1E]">
          <form onSubmit={handleSearch} className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 pr-14">
            <Search className="w-6 h-6 text-zinc-400 shrink-0" />
            <Input 
              autoFocus
              placeholder="Busque transações, metas ou tire dúvidas sobre o sistema..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 text-xl px-4 h-12 flex-1"
            />
            {query && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setQuery('')}
                className="rounded-full h-10 w-10 shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6 font-bold h-12 text-lg shrink-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
            </Button>
          </form>

          <div className="max-h-[400px] overflow-y-auto p-6 scrollbar-none">
            {!result && !isLoading && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Sugestões de busca
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: <Database className="w-4 h-4" />, text: "Quanto gastei com alimentação este mês?" },
                    { icon: <HelpCircle className="w-4 h-4" />, text: "Como funciona a senha de exibição?" },
                    { icon: <MessageSquare className="w-4 h-4" />, text: "Resuma minhas metas atuais" },
                    { icon: <Search className="w-4 h-4" />, text: "Buscar transações de ontem" }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setQuery(item.text);
                        // Trigger search manually since state update is async
                        searchSystem(item.text, {
                          transactions: store.transactions,
                          categories: store.categories,
                          goals: store.goals,
                          userSettings: store.userSettings
                        }).then(setResult);
                        setIsLoading(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors group"
                    >
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:text-purple-600">
                        {item.icon}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-100 dark:border-purple-900/30 rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin absolute inset-0" />
                </div>
                <p className="text-zinc-500 animate-pulse">Consultando a inteligência do Dindin...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-purple-600 text-sm font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Resultado da Busca
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-[2rem] border border-purple-100 dark:border-purple-900/30">
                  <Markdown>{result}</Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
