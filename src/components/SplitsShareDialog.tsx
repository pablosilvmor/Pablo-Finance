import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Facebook, Twitter, Linkedin, MessageCircle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface SplitsShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formattedMonth: string;
  currentYear: number;
  balances: [string, number][];
  filteredSplits: any[];
  totalToReceive: number;
  totalToPay: number;
  formatCurrency: (val: number) => string;
  getParticipantAmount: (t: any, p: any) => number;
}

export const SplitsShareDialog = ({ 
  open, 
  onOpenChange, 
  formattedMonth, 
  currentYear, 
  balances, 
  filteredSplits, 
  totalToReceive, 
  totalToPay, 
  formatCurrency, 
  getParticipantAmount 
}: SplitsShareDialogProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userSettings } = useAppStore();

  const getShareImage = async () => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // wait for layout/images
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem para compartilhamento.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const copyImageToClipboard = async () => {
    try {
      window.focus();
      const dataUrl = await getShareImage();
      if (!dataUrl) return;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      toast.success('Imagem copiada para a área de transferência!');
    } catch (error) {
      console.error('Error copying image:', error);
      toast.error('Erro ao copiar imagem. Seu navegador pode não suportar esta função.');
    }
  };

  const shareOnSocial = async (platform: string) => {
    const shareUrl = 'https://dindin-finance.vercel.app/';
    const text = `Confira os rateios de ${formattedMonth} ${currentYear}!`;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    window.open(url, '_blank');
  };

  const downloadImage = async () => {
    const dataUrl = await getShareImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `rateios-${formattedMonth}-${currentYear}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 lg:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-600" />
            Compartilhar Rateios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scrollable preview container */}
          <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white max-h-[50vh] overflow-y-auto custom-scrollbar">
            <div ref={cardRef} className="p-8 bg-white text-zinc-900 space-y-6 w-full max-w-[450px] mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <img src="https://i.imgur.com/rltsQSg.png" alt="Logo" className="w-8 h-8" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  <img src="https://i.imgur.com/6n9cYhs.png" alt="Dindin" className="h-6 object-contain" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-800">Rateios de {formattedMonth} {currentYear}</h3>
                
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">RESUMO DE SALDOS</p>
                   <div className="space-y-2">
                      {balances.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nenhum saldo pendente para este mês.</p>
                      ) : (
                        balances.slice(0, 10).map(([name, balance]) => (
                          <div key={name} className="flex justify-between items-center text-sm border-b border-dashed border-zinc-200 pb-1 last:border-0 last:pb-0">
                            <span className="text-zinc-600">{name}</span>
                            <span className={`font-bold ${balance > 0 ? 'text-[#01bfa5]' : 'text-[#ee5350]'}`}>
                              {balance > 0 ? 'A Receber' : 'A Pagar'}: {formatCurrency(balance)}
                            </span>
                          </div>
                        ))
                      )}
                      {balances.length > 10 && (
                        <p className="text-[10px] text-zinc-400 text-center">e mais {balances.length - 10} pessoas...</p>
                      )}
                   </div>
                </div>

                {filteredSplits.length > 0 && (
                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3 mt-4">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">DETALHAMENTO DO MÊS</p>
                     <div className="space-y-4">
                        {filteredSplits.map((t, idx) => (
                          <div key={idx} className="border-b border-dashed border-zinc-200 pb-3 last:border-0 last:pb-0">
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                  <p className="font-bold text-sm text-zinc-800">{t.description}</p>
                                  <p className="text-[10px] text-zinc-500">{new Date(t.date).toLocaleDateString()}</p>
                               </div>
                               <p className={`font-bold text-sm ${t.type === 'expense' ? 'text-[#ee5350]' : 'text-[#01bfa5]'}`}>
                                 {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                               </p>
                             </div>
                             <div className="space-y-1">
                                {t.split!.participants.map((p: any, pIdx: number) => {
                                   const pName = p.name.trim() || 'Desconhecido';
                                   const pAmt = getParticipantAmount(t, p);
                                   const isMe = pName.toLowerCase() === 'eu' || pName.toLowerCase() === 'mim';
                                   const paidAmt = p.paidAmount || 0;
                                   const pendingAmt = pAmt - paidAmt;
                                   const isFullyPaid = !isMe && pendingAmt < 0.01;
                                   
                                   return (
                                     <div key={pIdx} className="flex justify-between items-center text-[11px]">
                                        <span className={isMe ? "font-semibold text-purple-600" : "text-zinc-600"}>
                                          {pName} {isMe && "(Você)"} {isFullyPaid && "- Quitado"}
                                        </span>
                                        <span className={isFullyPaid ? 'text-zinc-400 line-through' : 'font-medium text-zinc-800'}>
                                          {formatCurrency(pAmt)}
                                          {!isMe && !isFullyPaid && (
                                            <span className="text-red-500 font-bold ml-1">
                                              (Pendente: {formatCurrency(pendingAmt)})
                                            </span>
                                          )}
                                        </span>
                                     </div>
                                   )
                                })}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Total a Receber</p>
                  <p className="text-xl font-black text-emerald-700">{formatCurrency(totalToReceive)}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl text-center border border-rose-100">
                  <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">Total a Pagar</p>
                  <p className="text-xl font-black text-rose-700">{formatCurrency(totalToPay)}</p>
                </div>
              </div>

              <div className="text-center pt-4 opacity-50 space-y-1">
                <p className="text-[10px] text-zinc-400 font-medium">Gerado em dindin-finance.vercel.app</p>
                <p className="text-[10px] text-zinc-400 font-medium">Desenvolvido por {userSettings.userName || 'Pablo Moreira'}</p>
              </div>
            </div>
            
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="rounded-2xl h-auto py-4 flex-col gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={copyImageToClipboard}
              disabled={isGenerating}
            >
              <Copy className="w-5 h-5 text-zinc-500" />
              <span className="text-xs font-bold">Copiar Imagem</span>
            </Button>
            <Button 
              variant="outline" 
              className="rounded-2xl h-auto py-4 flex-col gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={downloadImage}
              disabled={isGenerating}
            >
              <Download className="w-5 h-5 text-zinc-500" />
              <span className="text-xs font-bold">Baixar PNG</span>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'whatsapp', icon: MessageCircle, color: 'bg-green-500' },
              { id: 'facebook', icon: Facebook, color: 'bg-blue-600' },
              { id: 'twitter', icon: Twitter, color: 'bg-sky-500' },
              { id: 'linkedin', icon: Linkedin, color: 'bg-blue-700' },
            ].map((platform) => (
              <Button
                key={platform.id}
                variant="ghost"
                size="icon"
                className={cn("w-full h-12 rounded-xl text-white", platform.color)}
                onClick={() => shareOnSocial(platform.id)}
              >
                <platform.icon className="w-5 h-5" />
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
