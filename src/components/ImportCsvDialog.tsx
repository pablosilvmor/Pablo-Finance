import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportCsvDialog = ({ open, onOpenChange }: ImportCsvDialogProps) => {
  const { bulkUpsertTransactions, categories, transactions } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        throw new Error('O arquivo CSV está vazio ou possui apenas o cabeçalho.');
      }

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      // We expect columns like Data, Descrição, Categoria, Tipo, Valor, Status
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('memo'));
      const catIdx = headers.findIndex(h => h.includes('categoria') || h.includes('category'));
      const typeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('type'));
      const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount'));
      // fallback if headers are not exact
      if (dateIdx === -1 || valIdx === -1) {
        throw new Error('Colunas obrigatórias não encontradas. O arquivo deve ter pelo menos Date e Amount/Valor.');
      }

      const defaultCategory = categories[0]?.id || '';
      
      const newTransactions = lines.slice(1).map((line, index) => {
        const columns = line.split(delimiter).map(c => c.trim().replace(/"/g, ''));
        if (columns.length < 2) return null;

        const dateStr = columns[dateIdx];
        // Parse date like DD/MM/YYYY or YYYY-MM-DD
        let isoDate = new Date().toISOString();
        if (dateStr && dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[2]?.length === 4) { // DD/MM/YYYY
                isoDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString();
            }
        } else if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) isoDate = d.toISOString();
        }

        const rawAmount = columns[valIdx] || '0';
        let amountStr = rawAmount.replace(/[R$\sA-Za-z]/g, '');
        if (amountStr.includes(',')) {
          amountStr = amountStr.replace(/\./g, '').replace(',', '.');
        }
        let amount = parseFloat(amountStr) || 0;

        let type: 'income' | 'expense' = 'expense';
        if (typeIdx !== -1 && columns[typeIdx]) {
           type = columns[typeIdx].toLowerCase().includes('receita') || columns[typeIdx].toLowerCase().includes('income') ? 'income' : 'expense';
        } else if (amount < 0) {
           type = 'expense';
           amount = Math.abs(amount);
        } else {
           type = 'income';
        }

        let categoryId = defaultCategory;
        if (catIdx !== -1 && columns[catIdx]) {
           const found = categories.find(c => c.name.toLowerCase() === columns[catIdx].toLowerCase());
           if (found) categoryId = found.id;
        }

        const description = descIdx !== -1 ? columns[descIdx] : `Importação linha ${index + 1}`;

        return {
          id: `imp-${Date.now()}-${index}`,
          date: isoDate,
          description,
          amount,
          type,
          categoryId,
          status: 'paid' as const
        };
      }).filter(Boolean) as any[];

      // Filtrar duplicados
      const uniqueTransactions = newTransactions.filter(newTrans => {
        return !transactions.some(existingTrans => {
          // Normalizar datas para comparação (apenas dia/mês/ano)
          const newDate = new Date(newTrans.date).toDateString();
          const existDate = new Date(existingTrans.date).toDateString();
          
          return (
            newDate === existDate &&
            newTrans.description.toLowerCase() === existingTrans.description.toLowerCase() &&
            Math.abs(newTrans.amount - existingTrans.amount) < 0.01 // Diferença pequena aceitável (precisão float)
          );
        });
      });

      if (uniqueTransactions.length === 0) {
        toast.info('Todas as transações do arquivo já foram importadas anteriormente.');
      } else {
        await bulkUpsertTransactions(uniqueTransactions);
        toast.success(`${uniqueTransactions.length} novas transações importadas com sucesso!`);
      }
      onOpenChange(false);
      
    } catch (e: any) {
      toast.error(e.message || 'Erro ao processar o arquivo CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV (como um extrato bancário) para adicionar lançamentos em lote. As colunas ideais são: Data, Descrição, Valor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <input 
              type="file" 
              id="csv-upload" 
              accept=".csv"
              className="hidden" 
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <FileSpreadsheet className="w-8 h-8" />
                <span className="font-medium text-sm text-center">{file.name}</span>
                <Button variant="link" size="sm" onClick={() => setFile(null)} className="h-6 text-red-500">Remover</Button>
              </div>
            ) : (
              <label htmlFor="csv-upload" className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Upload className="w-8 h-8 text-zinc-400" />
                <span className="font-medium text-sm text-zinc-600 dark:text-zinc-400">Clique para selecionar um arquivo .csv</span>
              </label>
            )}
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>O sistema tentará categorizar automaticamente baseado nos nomes exatos. Categoria padrão será aplicada aos não identificados.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!file || isProcessing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isProcessing ? 'Importando...' : 'Importar dados'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
