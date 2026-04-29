import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareDialog = ({ open, onOpenChange }: ShareDialogProps) => {
  const shareUrl = 'https://pablo-finance.vercel.app/login';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado com sucesso!');
  };

  const shareOptions = [
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-green-500', 
      url: `https://wa.me/?text=${encodeURIComponent('Confira este app de finanças: ' + shareUrl)}` 
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-blue-600', 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'bg-sky-500', 
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Confira este app de finanças!')}` 
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      color: 'bg-blue-700', 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] bg-[#2C2C2E] text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-600" />
            Compartilhar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-medium text-zinc-500">Link de acesso</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm truncate text-zinc-600 dark:text-zinc-400">
                {shareUrl}
              </div>
              <Button size="icon" variant="outline" className="rounded-xl shrink-0" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <a 
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
              >
                <div className={`p-2 rounded-xl ${option.color} text-white`}>
                  <option.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{option.name}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
