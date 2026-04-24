import React, { useState } from 'react';
import { Bell, Search, Moon, Sun, Lightbulb, Eye, EyeOff, User, Settings, CreditCard, ShieldAlert, LogOut, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NewTransactionDialog } from './NewTransactionDialog';
import { ProfileDialog } from './ProfileDialog';
import { ShareDialog } from './ShareDialog';
import { SubscriptionDialog } from './SubscriptionDialog';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { useTheme } from './ThemeProvider';
import { auth } from '../lib/firebase';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { PrivacyPasswordDialog } from './PrivacyPasswordDialog';
import { useNavigate } from 'react-router';

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { userSettings, setIsTipsOpen, updateUserSettings } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleToggleValues = () => {
    if (userSettings.showValues) {
      updateUserSettings({ showValues: false });
    } else {
      setIsPasswordDialogOpen(true);
    }
  };

  const isFemale = userSettings.gender === 'female' || (!userSettings.gender && userSettings.userName?.trim().split(' ')[0].toLowerCase().endsWith('a'));

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        {userSettings.userName && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-left-4 duration-500">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              {isFemale ? 'Bem-vinda,' : 'Bem-vindo,'}
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">{userSettings.userName}</span>
          </div>
        )}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Explorar..."
            onClick={() => setIsSearchOpen(true)}
            readOnly
            className="w-full h-9 pl-9 pr-4 rounded-full bg-secondary border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:block">
          <NewTransactionDialog />
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-600" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-purple-600 dark:text-purple-400"
          onClick={() => setIsTipsOpen(true)}
        >
          <Lightbulb className="w-5 h-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-zinc-600 dark:text-zinc-400"
          onClick={handleToggleValues}
        >
          {userSettings.showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
            </Button>
          } />
          <DropdownMenuContent className="w-80 rounded-2xl p-2 bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold text-zinc-900 dark:text-white px-3 py-2">
                Notificações
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <div className="max-h-80 overflow-y-auto scrollbar-none">
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <p className="text-sm font-bold text-red-600">Conta próxima do vencimento</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Sua conta de Luz (CEMIG) vence em 2 dias. Valor: R$ 183,68.</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <p className="text-sm font-bold text-orange-600">Orçamento de Lazer</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Você já atingiu 80% do seu orçamento para Lazer este mês.</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <p className="text-sm font-bold text-purple-600">Insight da IA</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Notei que seus gastos com delivery aumentaram 20%. Que tal cozinhar em casa este fim de semana?</p>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={user?.photoURL || "https://github.com/shadcn.png"} alt="@user" />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || 'Usuário'}</p>
                  <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                    {user?.email || 'email@exemplo.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="space-y-1">
              <DropdownMenuItem onClick={() => setIsSubscriptionOpen(true)} className="rounded-xl cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2 text-zinc-500" />
                Assinatura
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShareOpen(true)} className="rounded-xl cursor-pointer">
                <Share2 className="w-4 h-4 mr-2 text-zinc-500" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl cursor-pointer">
                <Settings className="w-4 h-4 mr-2 text-zinc-500" />
                {t('settings')}
              </DropdownMenuItem>
              {user?.email === 'pablo.silvmor@gmail.com' && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-xl cursor-pointer">
                  <ShieldAlert className="w-4 h-4 mr-2 text-zinc-500" />
                  Painel Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="rounded-xl cursor-pointer">
                <User className="w-4 h-4 mr-2 text-zinc-500" />
                Perfil
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PrivacyPasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
        onSuccess={() => updateUserSettings({ showValues: true })} 
      />
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} />
      <SubscriptionDialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen} />
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
};
