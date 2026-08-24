import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, FileSpreadsheet, FileText, Trash2, ArrowLeft, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import { parsePdfTransactions, deduplicateTransactions } from '../lib/gemini';

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to clean column headers for resilient matching
const normalizeHeader = (h: string) => 
  (h || '')
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Helper to safely parse dates from various bank CSV formats
const parseCSVDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // Ignore invalid / summary row placeholder dates
  if (str === '00/00/0000' || str.startsWith('00/00') || str.includes('0000-00-00')) {
    return null;
  }

  if (str.includes('/') || str.includes('-') || str.includes('.')) {
    const sep = str.includes('/') ? '/' : (str.includes('-') ? '-' : '.');
    const parts = str.split(sep).map(p => p.trim());

    if (parts.length === 3) {
      let day = 0, month = 0, year = 0;
      
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD/MM/YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
      }

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      }
    }
  }

  const fallbackDate = new Date(str);
  if (!isNaN(fallbackDate.getTime()) && fallbackDate.getFullYear() >= 1900 && fallbackDate.getFullYear() <= 2100) {
    return fallbackDate.toISOString();
  }

  return null;
};

// Helper to parse amount and detect negative sign
const parseAmountAndSign = (rawVal: string): { amount: number; isNegative: boolean } => {
  if (!rawVal) return { amount: 0, isNegative: false };
  let str = rawVal.trim().replace(/[R$\s]/g, '');
  const isNegative = str.includes('-') || str.startsWith('(');
  str = str.replace(/[-()]/g, '').trim();

  if (str.includes(',') && str.includes('.')) {
    // Brazilian format: 1.649,36 -> 1649.36
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Brazilian format: 56,92 -> 56.92
    str = str.replace(',', '.');
  }

  const num = parseFloat(str) || 0;
  return { amount: Math.abs(num), isNegative: isNegative || num < 0 };
};

// Helper to filter out account summary / balance info lines
const isSummaryOrInvalidRow = (description: string, rawDateStr: string, amount: number): boolean => {
  if (!rawDateStr || rawDateStr.trim() === '00/00/0000' || rawDateStr.trim().startsWith('00/00')) {
    return true;
  }

  const norm = (description || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  if (
    norm === 'saldo' ||
    norm.includes('saldododia') ||
    norm.includes('saldoanterior') ||
    norm.includes('saldoatual') ||
    norm.includes('saldofinal') ||
    norm.includes('saldoparcial') ||
    norm.includes('resumododia') ||
    norm === 'saldoinforma'
  ) {
    return true;
  }

  return false;
};

export const ImportDataDialog = ({ open, onOpenChange }: ImportDataDialogProps) => {
  const { bulkUpsertTransactions, bulkDeleteTransactions, categories, transactions, setViewDate } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [view, setView] = useState<'import' | 'history'>('import');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setProgressText('Lendo arquivo...');

    let progressInterval: NodeJS.Timeout;

    try {
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'DATA';
      const importId = `imp-${fileExt}-${Date.now()}`;
      let newTransactions: any[] = [];

      if (file.name.toLowerCase().endsWith('.pdf')) {
        setProgressText('Preparando PDF...');
        // Read PDF as base64
        const buffer = await file.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        
        setProgressText('Analisando transações com IA... (isso pode levar um minuto)');
        setProgress(15);
        
        // Simulate progress for PDF processing
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 85) return prev;
            return prev + Math.floor(Math.random() * 5) + 1; // max 90
          });
        }, 1500);

        let pdfData = await parsePdfTransactions(base64, categories);
        
        clearInterval(progressInterval);
        setProgress(90);

        if (!pdfData || pdfData.length === 0) {
          throw new Error('Nenhuma transação foi encontrada no PDF ou ocorreu um erro de leitura pela IA.');
        }

        const defaultCategory = categories[0]?.id || '';
        
        newTransactions = pdfData.map((t, index) => {
          let type: 'income' | 'expense' = t.type === 'income' ? 'income' : 'expense';
          let amount = Math.abs(parseFloat(String(t.amount).replace(/,/g, '.')) || 0);

          let parsedDate = new Date();
          if (t.date) {
            // Tentar ISO YYYY-MM-DD
            let d = new Date(`${t.date}T12:00:00Z`);
            if (!isNaN(d.getTime())) {
              parsedDate = d;
            } else {
               // Split por barra ou traço
               const separator = t.date.includes('/') ? '/' : (t.date.includes('-') ? '-' : null);
               if (separator) {
                 const parts = t.date.split(separator);
                 if (parts.length === 3) {
                   let year = parts[2];
                   if (year.length === 2) {
                     year = '20' + year;
                   }
                   // Se a primeira parte tiver 4 dígitos, é YYYY-MM-DD
                   if (parts[0].length === 4) {
                     d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
                   } else {
                     d = new Date(`${year}-${parts[1]}-${parts[0]}T12:00:00Z`);
                   }
                 } else if (parts.length === 2) {
                   // DD/MM assume o ano atual
                   const currentYear = new Date().getFullYear();
                   d = new Date(`${currentYear}-${parts[1]}-${parts[0]}T12:00:00Z`);
                 }
                 
                 if (!isNaN(d.getTime())) {
                   parsedDate = d;
                 }
               }
               
               if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000 || parsedDate.getFullYear() > 2100) {
                 d = new Date(t.date);
                 if (!isNaN(d.getTime())) {
                   if (d.getFullYear() < 2000 || d.getFullYear() > 2100) {
                     d.setFullYear(new Date().getFullYear());
                   }
                   parsedDate = d;
                 } else {
                   console.error("Data inválida recebida:", t.date);
                   parsedDate = new Date(); // fallback safe
                 }
               }
            }
          }
          
          let finalCategoryId = defaultCategory;
          if (t.categoryId) {
             const found = categories.find(c => 
               c.id === t.categoryId || 
               c.name.toLowerCase() === String(t.categoryId).toLowerCase() ||
               c.name.toLowerCase().includes(String(t.categoryId).toLowerCase()) 
             );
             if (found) {
               finalCategoryId = found.id;
             }
          }
          
          console.log("Importando PDF transaction:", t.description, "Data original:", t.date, "Data parseada:", parsedDate.toISOString(), "CategoryId:", finalCategoryId);

          return {
            id: `${importId}-${index}`,
            date: parsedDate.toISOString(),
            description: t.description || `Importação PDF ${index + 1}`,
            amount,
            type,
            categoryId: finalCategoryId,
            status: 'paid' as const,
            importId
          };
        });

      } else if (file.name.toLowerCase().endsWith('.ofx')) {
        setProgressText('Processando OFX...');
        setProgress(40);
        const text = await file.text();
        
        // Simple OFX Parser using Regex
        const transactionsMatch = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g);
        
        if (!transactionsMatch || transactionsMatch.length === 0) {
          throw new Error('Nenhuma transação encontrada no arquivo OFX.');
        }

        const defaultCategory = categories[0]?.id || '';
        
        newTransactions = transactionsMatch.map((match, index) => {
          const type = match.match(/<TRNTYPE>(.*?)<\/TRNTYPE>|<TRNTYPE>(.*)/)?.[1]?.trim().toLowerCase() || 
                       match.match(/<TRNTYPE>(.*)/)?.[1]?.trim().toLowerCase();
          const dateStr = match.match(/<DTPOSTED>(.*?)<\/DTPOSTED>|<DTPOSTED>(.*)/)?.[1]?.trim() || 
                          match.match(/<DTPOSTED>(.*)/)?.[1]?.trim();
          const amountStr = match.match(/<TRNAMT>(.*?)<\/TRNAMT>|<TRNAMT>(.*)/)?.[1]?.trim() || 
                            match.match(/<TRNAMT>(.*)/)?.[1]?.trim();
          const memo = match.match(/<MEMO>(.*?)<\/MEMO>|<MEMO>(.*)/)?.[1]?.trim() || 
                       match.match(/<MEMO>(.*)/)?.[1]?.trim();
          const name = match.match(/<NAME>(.*?)<\/NAME>|<NAME>(.*)/)?.[1]?.trim() || 
                       match.match(/<NAME>(.*)/)?.[1]?.trim();

          if (!dateStr || !amountStr) return null;

          // Parse Date (Format: YYYYMMDD...)
          let isoDate = new Date().toISOString();
          if (dateStr.length >= 8) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            isoDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
          }

          let amount = parseFloat(amountStr.replace(',', '.')) || 0;
          const transType: 'income' | 'expense' = amount > 0 ? 'income' : 'expense';
          amount = Math.abs(amount);

          const description = name || memo || `Importação OFX ${index + 1}`;

          return {
            id: `${importId}-${index}`,
            date: isoDate,
            description,
            amount,
            type: transType,
            categoryId: defaultCategory,
            status: 'paid' as const,
            importId
          };
        }).filter(Boolean) as any[];

        setProgress(70);
      } else {
        setProgressText('Processando CSV...');
        setProgress(40);
        const text = await file.text();
        const Papa = await import('papaparse');
        
        const parsed = Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
        });

        setProgress(70);

        if (parsed.errors.length > 0) {
          console.warn('PapaParse errors:', parsed.errors);
        }

        const lines = parsed.data as string[][];

        if (lines.length <= 1) {
          throw new Error('O arquivo CSV está vazio ou possui apenas o cabeçalho.');
        }

        const headers = lines[0];
        const cleanedHeaders = headers.map(normalizeHeader);

        const isNubankCreditCard = cleanedHeaders.includes('date') && cleanedHeaders.includes('title') && cleanedHeaders.includes('amount');

        let dateIdx = cleanedHeaders.findIndex(h => h.includes('data') || h.includes('date'));
        let descIdx = cleanedHeaders.findIndex(h => h.includes('lancamento') || h.includes('descri') || h.includes('memo') || h.includes('title') || h.includes('historico'));
        let detailsIdx = cleanedHeaders.findIndex(h => h.includes('detalhe') || h.includes('complemento') || h.includes('obs'));
        let catIdx = cleanedHeaders.findIndex(h => h.includes('categoria') || h.includes('category'));
        let typeIdx = cleanedHeaders.findIndex(h => h.includes('tipolancamento') || h.includes('tipo') || h.includes('type') || h.includes('natureza'));
        let valIdx = cleanedHeaders.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('val'));

        // Fallbacks if indices are missing
        if (dateIdx === -1) dateIdx = 0;
        if (valIdx === -1) {
          valIdx = cleanedHeaders.findIndex((_, i) => lines[1]?.[i] && !isNaN(parseFloat(lines[1][i].replace(/[R$\s,.]/g, ''))));
        }

        if (dateIdx === -1 || valIdx === -1) {
          throw new Error('Colunas obrigatórias de data e valor não foram encontradas no CSV.');
        }

        const defaultCategory = categories[0]?.id || '';

        newTransactions = lines.slice(1).map((columns, index) => {
          if (!columns || columns.length < 2) return null;

          const rawDateStr = columns[dateIdx] || '';
          const isoDate = parseCSVDate(rawDateStr);
          if (!isoDate) return null; // Invalid date or summary row date like 00/00/0000

          const rawDesc = descIdx !== -1 && columns[descIdx] ? columns[descIdx].trim() : '';
          const rawDetails = detailsIdx !== -1 && columns[detailsIdx] ? columns[detailsIdx].trim() : '';

          let description = '';
          if (rawDesc && rawDetails) {
            description = `${rawDesc} - ${rawDetails}`;
          } else {
            description = rawDesc || rawDetails || `Importação linha ${index + 1}`;
          }

          const rawAmount = columns[valIdx] || '0';
          const { amount, isNegative } = parseAmountAndSign(rawAmount);

          if (isSummaryOrInvalidRow(description, rawDateStr, amount)) {
            return null;
          }

          // Determine transaction type
          let type: 'income' | 'expense' = 'expense';
          const rawType = typeIdx !== -1 && columns[typeIdx] ? columns[typeIdx].trim().toLowerCase() : '';

          if (rawType) {
            if (rawType.includes('sada') || rawType.includes('saida') || rawType.includes('saída') || rawType.includes('débito') || rawType.includes('debito') || (rawType.startsWith('s') || rawType.startsWith('d')) && !rawType.includes('entrada') && !rawType.includes('receita') && !rawType.includes('income')) {
              type = 'expense';
            } else if (rawType.includes('entrada') || rawType.includes('receita') || rawType.includes('income') || rawType.includes('crédito') || rawType.includes('credito') || rawType.startsWith('e') || rawType.startsWith('c')) {
              type = 'income';
            } else {
              type = isNegative ? 'expense' : 'income';
            }
          } else if (isNubankCreditCard) {
            type = amount > 0 ? 'expense' : 'income';
          } else if (isNegative) {
            type = 'expense';
          } else {
            type = 'income';
          }

          let categoryId = defaultCategory;
          if (catIdx !== -1 && columns[catIdx]) {
            const found = categories.find(c => c.name.toLowerCase() === columns[catIdx].toLowerCase());
            if (found) categoryId = found.id;
          }

          return {
            id: `${importId}-${index}`,
            date: isoDate,
            description,
            amount,
            type,
            categoryId,
            status: 'paid' as const,
            importId
          };
        }).filter(Boolean) as any[];
      }

      setProgressText('Analisando duplicidades com IA...');
      setProgress(95);

      const newDates = new Set(newTransactions.map(t => new Date(t.date).toDateString()));
      
      // Select only required fields to avoid blowing up context window
      const relevantExisting = transactions
          .filter(t => newDates.has(new Date(t.date).toDateString()))
          .map(t => ({ id: t.id, date: t.date, amount: t.amount, description: t.description }));
          
      const relevantNew = newTransactions.map(t => ({ id: t.id, date: t.date, amount: t.amount, description: t.description }));

      const nonDuplicateNewItems = await deduplicateTransactions(relevantNew, relevantExisting);
      const nonDuplicateNewIds = new Set(nonDuplicateNewItems.map((t: any) => t.id));
      
      const uniqueTransactions = newTransactions.filter(t => nonDuplicateNewIds.has(t.id));

      if (uniqueTransactions.length === 0) {
        toast.info('Todas as transações do arquivo já foram importadas anteriormente.');
      } else {
        await bulkUpsertTransactions(uniqueTransactions);
        setProgress(100);
        setProgressText('Concluído!');
        // Delay closing slightly so user sees 100%
        await new Promise(r => setTimeout(r, 600));
        toast.success(`${uniqueTransactions.length} novas transações importadas com sucesso!`);
        const latestTransaction = uniqueTransactions.reduce((latest, current) => {
           const currentDate = new Date(current.date);
           const latestDate = new Date(latest.date);
           return currentDate > latestDate ? current : latest;
        }, uniqueTransactions[0]);
        if (latestTransaction) {
           setViewDate(new Date(latestTransaction.date));
        }
      }
      setFile(null);
      setProgress(0);
      onOpenChange(false);
      
    } catch (e: any) {
      if (progressInterval!) clearInterval(progressInterval);
      toast.error(e.message || 'Erro ao processar o arquivo.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const importHistory = useMemo(() => {
    const historyMap = new Map<string, { importId: string, count: number, timestamp: number, type: string }>();
    
    transactions.forEach(t => {
      if (t.importId) {
        if (!historyMap.has(t.importId)) {
          const parts = t.importId.split('-');
          // Format expected: imp-[TYPE]-[TIMESTAMP]
          let type = parts.length >= 3 ? parts[1] : (t.description.includes('PDF') ? 'PDF' : (t.description.includes('OFX') ? 'OFX' : 'CSV'));
          
          // Force OFX type if importId contains OFX
          if (t.importId.includes('OFX')) type = 'OFX';
          
          const timestamp = parseInt(parts[parts.length - 1]) || Date.now();
          
          historyMap.set(t.importId, { 
            importId: t.importId, 
            count: 1, 
            timestamp,
            type
          });
        } else {
          historyMap.get(t.importId)!.count++;
        }
      }
    });

    return Array.from(historyMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  const handleDeleteImport = async (importId: string) => {
    const idsToDelete = transactions.filter(t => t.importId === importId).map(t => t.id);
    if (idsToDelete.length === 0) return;
    
    try {
      await bulkDeleteTransactions(idsToDelete);
      toast.success(`${idsToDelete.length} transações removidas com sucesso.`);
    } catch (e) {
      toast.error('Erro ao remover importação.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {view === 'import' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-6">
                Importar Dados
                <Button variant="ghost" size="sm" onClick={() => setView('history')} className="text-zinc-500 gap-1 h-8 px-2 -mr-4">
                  <History className="w-4 h-4" />
                  Histórico
                </Button>
              </DialogTitle>
              <DialogDescription>
                Faça upload de um arquivo PDF ou CSV (como um extrato bancário) para adicionar lançamentos em lote.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div 
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="data-upload" 
                  accept=".csv,.pdf,.ofx,application/pdf,text/csv"
                  className="hidden" 
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2 text-primary">
                    {file.name.toLowerCase().endsWith('.pdf') ? <FileText className="w-8 h-8" /> : <FileSpreadsheet className="w-8 h-8" />}
                    <span className="font-medium text-sm text-center">{file.name}</span>
                    <Button variant="link" size="sm" onClick={() => setFile(null)} className="h-6 text-red-500">Remover</Button>
                  </div>
                ) : (
                  <label htmlFor="data-upload" className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-zinc-400'}`} />
                    <span className="font-medium text-sm text-center text-zinc-600 dark:text-zinc-400">
                      {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste um arquivo PDF, CSV ou OFX'}
                    </span>
                    <span className="text-xs text-zinc-400 text-center">PDFs usam IA para identificar transações automaticamente.</span>
                  </label>
                )}
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-medium">
                    <span>{progressText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>O sistema tentará categorizar automaticamente. Se for um PDF, usaremos inteligência artificial para entender seu extrato.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleImport} disabled={!file || isProcessing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isProcessing ? 'Importando...' : 'Importar dados'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('import')} className="h-8 w-8 -ml-2 text-zinc-500">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Histórico de Importações</DialogTitle>
              </div>
              <DialogDescription>
                Gerencie importações passadas e reverta-as se necessário.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
              {importHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Nenhuma importação recente encontrada.
                </div>
              ) : (
                importHistory.map(history => (
                  <div key={history.importId} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {history.type === 'PDF' && <FileText className="w-4 h-4 text-primary" />}
                        {history.type === 'CSV' && <FileSpreadsheet className="w-4 h-4 text-green-500" />}
                        {history.type === 'OFX' && <FileText className="w-4 h-4 text-blue-500" />}
                        Importação {history.type}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {new Date(history.timestamp).toLocaleString()} • {history.count} itens
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteImport(history.importId)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Desfazer
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

