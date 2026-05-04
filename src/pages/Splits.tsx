import React, { useMemo, useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDownIcon, ArrowRightLeft, ArrowUpIcon, Search, Tag, Users, Share2, FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { MonthPicker } from '../components/MonthPicker';
import { NewTransactionDialog } from '../components/NewTransactionDialog';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const Splits = () => {
  const { transactions, userSettings } = useAppStore();
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleMonthChange = (newMonthStr: string) => {
    setSelectedMonth(newMonthStr);
    setSelectedDateObj(new Date(`${newMonthStr}-01T00:00:00`));
    setIsMonthPickerOpen(false);
  };

  const handlePrevMonth = () => {
    const prevDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() - 1, 1);
    handleMonthChange(prevDate.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 1);
    handleMonthChange(nextDate.toISOString().substring(0, 7));
  };

  const monthName = new Intl.DateTimeFormat(userSettings?.language || 'pt-BR', { month: 'long' }).format(new Date(`${selectedMonth}-01T00:00:00`));
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentYear = selectedDateObj.getFullYear();

  const getParticipantAmount = (t: any, p: any) => {
    if (t.split.type === 'equal') return t.amount / t.split.participants.length;
    if (t.split.type === 'percentage') return (t.amount * (p.percentage || 0)) / 100;
    return p.amount || 0;
  };

  const filteredSplits = useMemo(() => {
    return transactions.filter(t => {
      const dateStr = t.date.substring(0, 7);
      if (dateStr !== selectedMonth || !t.split || t.status === 'pending') return false;
      
      // Check if all participants (excluding 'Eu') are fully paid
      let isFullyPaid = true;
      let hasOthers = false;
      t.split.participants.forEach(p => {
        const name = p.name.trim().toLowerCase();
        if (name === 'eu' || name === 'mim') return;
        hasOthers = true;
        const pAmt = getParticipantAmount(t, p);
        if (pAmt - (p.paidAmount || 0) > 0.01) {
          isFullyPaid = false;
        }
      });

      if (!hasOthers) return false;

      return !isFullyPaid;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  const { balances, totalToReceive, totalToPay } = useMemo(() => {
    const pBalances: Record<string, number> = {};
    let receive = 0;
    let pay = 0;

    filteredSplits.forEach(t => {
      t.split!.participants.forEach(p => {
        const name = p.name.trim();
        if (name.toLowerCase() === 'eu' || name.toLowerCase() === 'mim' || name === '') return;

        const amount = getParticipantAmount(t, p);
        const pendingAmount = amount - (p.paidAmount || 0);
        
        if (pendingAmount < 0.01) return; // Fully paid by this person

        if (!pBalances[name]) pBalances[name] = 0;

        if (t.type === 'expense') {
          pBalances[name] += pendingAmount;
          receive += pendingAmount;
        } else if (t.type === 'income') {
          pBalances[name] -= pendingAmount;
          pay += pendingAmount;
        }
      });
    });

    return { 
      balances: Object.entries(pBalances).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])),
      totalToReceive: receive,
      totalToPay: pay
    };
  }, [filteredSplits]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(userSettings.language, { 
      style: 'currency', 
      currency: userSettings.currency 
    }).format(Math.abs(val));
  };

  const handleShare = async () => {
    if (!pageRef.current) return;
    try {
      setIsSharing(true);
      // Brief delay to allow UI to settle if resolving buttons visibility
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(pageRef.current, { backgroundColor: '#ffffff', filter: (node) => !node.classList?.contains('no-export') });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'rateios.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'Resumo de Rateios',
          files: [file]
        });
      } else {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        toast.success('Imagem copiada para a área de transferência!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao compartilhar. Verifique as permissões do navegador.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Resumo de Rateios - ${selectedMonth}`, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Total a Receber: ${formatCurrency(totalToReceive)}`, 14, 25);
    doc.text(`Total a Pagar: ${formatCurrency(totalToPay)}`, 14, 30);
    
    if (balances.length > 0) {
      const tableData = balances.map(([name, balance]) => {
         return [name, balance > 0 ? "A Receber" : "A Pagar", formatCurrency(Math.abs(balance))];
      });
      autoTable(doc, {
        startY: 40,
        head: [['Pessoa', 'Situação', 'Valor']],
        body: tableData,
      });
    }

    doc.save(`Rateios_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" ref={pageRef}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div 
            className="text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800/60 rounded-full font-medium text-sm px-6 py-2 min-w-[140px] text-center cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMonthPickerOpen(true);
            }}
          >
            {formattedMonth} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <MonthPicker open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen} selectedDate={selectedDateObj} onSelect={(d) => handleMonthChange(d.toISOString().substring(0, 7))} />
        
        <div className="flex items-center gap-2 no-export">
          <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing}>
            <Share2 className="w-4 h-4 mr-2" />
            {isSharing ? 'Compartilhando...' : 'Compartilhar'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Salvar PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center text-center justify-center py-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-3xl mb-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 mb-4 shadow-sm border border-purple-200/50 dark:border-purple-800/50">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Rateios do Mês</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
          Acompanhe os valores divididos neste período para saber quem deve e para quem você deve.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1">Total a Receber</p>
            <p className="text-2xl font-bold text-[#01bfa5]">{formatCurrency(totalToReceive)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1">Total a Pagar</p>
            <p className="text-2xl font-bold text-[#ee5350]">{formatCurrency(totalToPay)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm mt-6">
        <CardHeader>
          <CardTitle>Saldos por Pessoa</CardTitle>
          <CardDescription>Resumo de dívidas neste mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balances.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                Nenhum saldo rateado retornado para este mês.
              </div>
            ) : (
              balances.map(([name, balance]) => {
                if (Math.abs(balance) < 0.01) return null; // Ignore fully settled
                
                const isOwed = balance > 0;
                
                return (
                  <div key={name} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${isOwed ? 'bg-[#01bfa5]/10 text-[#01bfa5]' : 'bg-[#ee5350]/10 text-[#ee5350]'}`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{name}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          {isOwed ? (
                            <>Está te devendo</>
                          ) : (
                            <>Você deve a esta pessoa</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${isOwed ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Transações Rateadas</h2>
        {filteredSplits.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            Nenhuma transação rateada neste mês.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSplits.map(t => (
               <Card key={t.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                       <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t.description}</p>
                          <p className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString()}</p>
                       </div>
                       <div className="text-right">
                        <p className={`font-bold ${t.type === 'expense' ? 'text-[#ee5350]' : 'text-[#01bfa5]'}`}>
                          {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-xs text-zinc-500">{t.type === 'expense' ? 'Despesa' : 'Receita'}</p>
                       </div>
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                          Participantes do Rateio
                        </p>
                        {t.split!.participants.map((p, idx) => {
                           const pName = p.name.trim() || 'Desconhecido';
                           const pAmt = getParticipantAmount(t, p);
                           
                           const isMe = pName.toLowerCase() === 'eu' || pName.toLowerCase() === 'mim';
                           const paidAmt = p.paidAmount || 0;
                           const pendingAmt = pAmt - paidAmt;
                           const isFullyPaid = !isMe && pendingAmt < 0.01;

                           return (
                               <div key={idx} className="flex justify-between text-sm items-center py-1">
                                  <div className="flex flex-col">
                                    <span className={isMe ? "font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1" : "text-zinc-600 dark:text-zinc-400"}>
                                      {pName} {isMe && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 px-1.5 rounded text-purple-600 dark:text-purple-400">Você</span>}
                                      {isFullyPaid && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">Quitado</span>}
                                    </span>
                                    {(!isMe && paidAmt > 0 && !isFullyPaid) && (
                                      <span className="text-[10px] text-zinc-400">Pago: {formatCurrency(paidAmt)}</span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-medium ${isFullyPaid ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-200'}`}>
                                      {formatCurrency(pAmt)}
                                    </span>
                                    {(!isMe && !isFullyPaid) && (
                                      <p className="text-[10px] font-bold text-red-500">Pendente: {formatCurrency(pendingAmt)}</p>
                                    )}
                                  </div>
                               </div>
                           )
                        })}
                     </div>
                     <div className="absolute top-2 right-2 no-export">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 w-8 p-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 backdrop-blur-sm"
                         onClick={() => {
                            setEditingTransactionId(t.id);
                            setIsEditing(true);
                         }}
                         title="Abrir transação para edição ou quitação"
                       >
                         <ExternalLink className="w-4 h-4 text-purple-600" />
                       </Button>
                     </div>
                  </CardContent>
               </Card>
            ))}
          </div>
        )}
      </div>

      <NewTransactionDialog 
        open={isEditing} 
        onOpenChange={setIsEditing} 
        transactionId={editingTransactionId} 
      />
    </div>
  );
};
