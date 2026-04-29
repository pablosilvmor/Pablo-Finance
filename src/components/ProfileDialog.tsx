import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { auth } from '@/lib/firebase';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { userSettings, updateUserSettings } = useAppStore();
  const user = auth.currentUser;
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleVerify = () => {
    if (verificationPassword === userSettings.privacyPassword) {
      setShowPassword(true);
      setIsVerifying(false);
      setVerificationPassword('');
    } else {
      toast.error('Senha incorreta');
    }
  };

  const handleChangePassword = () => {
    if (newPassword.length < 4) {
      toast.error('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    updateUserSettings({ privacyPassword: newPassword });
    toast.success('Senha alterada com sucesso');
    setNewPassword('');
    setIsChanging(false);
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] bg-[#2C2C2E] text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-purple-600" />
            Perfil do Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail
            </Label>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              {user?.email || 'pablo.silvmor@gmail.com'}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Senha de Exibição
            </Label>
            <div className="relative">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white flex items-center justify-between">
                <span>{showPassword ? userSettings.privacyPassword : '••••'}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    if (showPassword) {
                      setShowPassword(false);
                    } else {
                      setIsVerifying(true);
                    }
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {isVerifying && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 space-y-3">
              <Label className="text-xs font-bold text-purple-600 uppercase tracking-wider">Verificar Identidade</Label>
              <Input 
                type="password" 
                placeholder="Digite a senha atual" 
                value={verificationPassword}
                onChange={(e) => setVerificationPassword(e.target.value)}
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsVerifying(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700" onClick={handleVerify}>Verificar</Button>
              </div>
            </div>
          )}

          {showPassword && !isChanging && (
            <Button 
              variant="outline" 
              className="w-full rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
              onClick={() => setIsChanging(true)}
            >
              Redefinir Senha
            </Button>
          )}

          {isChanging && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nova Senha</Label>
              <Input 
                type="password" 
                placeholder="Digite a nova senha" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsChanging(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700" onClick={handleChangePassword}>Salvar</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
