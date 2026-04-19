import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Facebook, Twitter, Linkedin, MessageCircle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';

interface CalculationShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calcName: string;
  memory: string;
  result: string;
}

export const CalculationShareDialog = ({ open, onOpenChange, calcName, memory, result }: CalculationShareDialogProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getShareImage = async () => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      // Wait a bit for any fonts/images to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
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
      // Fallback to copying text if image copy fails
      const text = `${calcName}\n\n${memory}\n\nResultado: ${result}\n\nhttps://pablo-finance.vercel.app/login`;
      
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          toast.success('Texto do cálculo copiado (seu navegador não suporta cópia de imagem).');
        } else {
          throw new Error('Clipboard API not available');
        }
      } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Texto do cálculo copiado (seu navegador não suporta cópia de imagem).');
        } catch (copyErr) {
          console.error('Fallback copy failed:', copyErr);
          toast.error('Erro ao copiar o texto.');
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const shareOnSocial = async (platform: string) => {
    const shareUrl = 'https://pablo-finance.vercel.app/login';
    const text = `Confira meu cálculo de ${calcName} no Pablo Finance!`;
    
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
    link.download = `calculo-${calcName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-600" />
            Compartilhar Cálculo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview of what will be shared (Hidden or visible as preview) */}
          <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white">
            <div ref={cardRef} className="p-8 bg-white text-zinc-900 space-y-6 w-full max-w-[400px] mx-auto">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <img src="https://i.imgur.com/rltsQSg.png" alt="Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
                  <img src="https://i.imgur.com/6n9cYhs.png" alt="Dindin" className="h-6 object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">PABLO MOREIRA</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-800">{calcName}</h3>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Memória de Cálculo</p>
                  <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-mono leading-relaxed">
                    {memory}
                  </pre>
                </div>
              </div>

              <div className="bg-purple-600 p-4 rounded-xl text-center shadow-lg shadow-purple-600/20">
                <p className="text-xs text-purple-100 font-medium mb-1">Resultado Final</p>
                <p className="text-2xl font-black text-white">{result}</p>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-zinc-400">Gerado em pablo-finance.vercel.app</p>
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
