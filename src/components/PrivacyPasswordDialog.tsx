import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Delete } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { auth } from '@/lib/firebase';

interface PrivacyPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PrivacyPasswordDialog = ({ open, onOpenChange, onSuccess }: PrivacyPasswordDialogProps) => {
  const { userSettings, updateUserSettings } = useAppStore();
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'unlock' | 'reset_current' | 'reset_new'>('unlock');
  const [newPassword, setNewPassword] = useState('');

  const handleNumberClick = (num: string) => {
    if (password.length < 4) {
      const nextPassword = password + num;
      setPassword(nextPassword);
      
      const currentStoredPassword = userSettings.privacyPassword || '0000';

      if (nextPassword.length === 4) {
        if (mode === 'unlock') {
          if (nextPassword === currentStoredPassword) {
            onSuccess();
            setPassword('');
            onOpenChange(false);
          } else {
            toast.error('Senha incorreta');
            setTimeout(() => setPassword(''), 500);
          }
        } else if (mode === 'reset_current') {
          if (nextPassword === currentStoredPassword) {
            setMode('reset_new');
            setPassword('');
            toast.success('Digite a nova senha');
          } else {
            toast.error('Senha atual incorreta');
            setTimeout(() => setPassword(''), 500);
          }
        } else if (mode === 'reset_new') {
          updateUserSettings({ privacyPassword: nextPassword });
          toast.success('Senha alterada com sucesso!');
          setMode('unlock');
          setPassword('');
        }
      }
    }
  };

  const handleForgot = () => {
    const sender = 'pablo.silvmor@gmail.com';
    const recipient = auth.currentUser?.email || 'seu e-mail';
    toast.success(`Sua senha foi enviada por ${sender} para ${recipient}`);
    console.log(`[PRIVACY] Email from ${sender} to ${recipient}: Password is ${userSettings.privacyPassword || '0000'}`);
  };

  const handleDelete = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!open) {
      setPassword('');
      setMode('unlock');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, password, userSettings.privacyPassword, mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[360px] p-0 bg-white dark:bg-[#1C1C1E] border-none rounded-[2.5rem] overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <button 
              className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <div className="text-center">
              <DialogTitle className="text-xl font-bold">
                {mode === 'unlock' ? 'Digite sua senha' : mode === 'reset_current' ? 'Senha Atual' : 'Nova Senha'}
              </DialogTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {mode === 'unlock' ? 'Para exibir os valores do sistema' : mode === 'reset_current' ? 'Confirme sua senha atual' : 'Escolha uma nova senha de 4 dígitos'}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 border-purple-600 transition-all duration-200 ${
                  password.length > i ? 'bg-purple-600 scale-110' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <Button
                key={num}
                variant="ghost"
                className="h-16 text-2xl font-bold rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleNumberClick(num)}
              >
                {num}
              </Button>
            ))}
            <div />
            <Button
              variant="ghost"
              className="h-16 text-2xl font-bold rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-16 flex items-center justify-center rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              onClick={handleDelete}
            >
              <Delete className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button 
              variant="ghost" 
              className="text-purple-600 font-medium"
              onClick={() => {
                setMode(mode === 'unlock' ? 'reset_current' : 'unlock');
                setPassword('');
              }}
            >
              {mode === 'unlock' ? 'Redefinir Senha' : 'Cancelar Redefinição'}
            </Button>
            <Button 
              variant="ghost" 
              className="text-zinc-400 text-xs"
              onClick={handleForgot}
            >
              Esqueci a Senha
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
