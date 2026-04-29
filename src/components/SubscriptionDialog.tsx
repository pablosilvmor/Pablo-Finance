import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { CreditCard, Sparkles, UserCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { detectGender } from '@/lib/gemini';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionDialog = ({ open, onOpenChange }: SubscriptionDialogProps) => {
  const { userSettings, updateUserSettings } = useAppStore();
  const [name, setName] = useState(userSettings.userName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Por favor, informe como deseja ser chamado');
      return;
    }
    setIsSaving(true);
    const gender = await detectGender(name);
    updateUserSettings({ userName: name, gender });
    toast.success('Nome atualizado com sucesso!');
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] bg-[#2C2C2E] text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
            Assinatura & Perfil
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-sm text-purple-900 dark:text-purple-100">
              Personalize sua experiência no Dindin. Como você gostaria de ser chamado pelo sistema?
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
              <UserCircle className="w-4 h-4" /> Seu Nome / Apelido
            </Label>
            <Input 
              placeholder="Ex: Pablo, Amigão, Mestre..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-12 text-lg"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
