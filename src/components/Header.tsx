import React, { useState, useMemo } from 'react';
import { Bell, Search, Moon, Sun, Lightbulb, Eye, EyeOff, User, Settings, CreditCard, ShieldAlert, LogOut, Share2, Info, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NewTransactionDialog } from './NewTransactionDialog';
import { ProfileDialog } from './ProfileDialog';
import { ShareDialog } from './ShareDialog';
import { SubscriptionDialog } from './SubscriptionDialog';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const { userSettings, setIsTipsOpen, updateUserSettings, transactions, monthlyPlan, categories } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const notifications = useMemo(() => {
    const list: { id: string; title: string; description: string; color: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Contas Próximas do Vencimento (Próximos 3 dias e vencidas recentemente)
    const upcomingExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      t.status === 'pending' && 
      !t.ignored
    );

    upcomingExpenses.forEach(trans => {
      const dueDate = new Date(trans.date);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays >= -5) {
        let deadlineLabel = '';
        if (diffDays === 0) deadlineLabel = 'vence hoje';
        else if (diffDays === 1) deadlineLabel = 'vence amanhã';
        else if (diffDays > 1) deadlineLabel = `vence em ${diffDays} dias`;
        else deadlineLabel = `vencida há ${Math.abs(diffDays)} dias`;

        list.push({
          id: `trans-${trans.id}`,
          title: 'Conta próxima do vencimento',
          description: `${trans.description} ${deadlineLabel}. Valor: ${new Intl.NumberFormat(userSettings.language, { style: 'currency', currency: userSettings.currency }).format(trans.amount)}`,
          color: 'text-red-600'
        });
      }
    });

    // 2. Orçamentos próximos do limite (80% ou mais)
    if (monthlyPlan && monthlyPlan.budgets && monthlyPlan.budgets.length > 0) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && !t.ignored;
      });

      monthlyPlan.budgets.forEach(budget => {
        if (budget.limit <= 0) return;

        const catSpent = monthlyTransactions
          .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
          .reduce((acc, t) => acc + t.amount, 0);

        const percentage = (catSpent / budget.limit) * 100;
        if (percentage >= 80) {
          const category = categories.find(c => c.id === budget.categoryId);
          if (category) {
            list.push({
              id: `budget-${budget.categoryId}`,
              title: `Orçamento de ${category.name}`,
              description: `Você já atingiu ${percentage.toFixed(0)}% do seu orçamento para ${category.name} este mês.`,
              color: percentage >= 100 ? 'text-red-600' : 'text-orange-600'
            });
          }
        }
      });
    }

    return list;
  }, [transactions, monthlyPlan, categories, userSettings.language, userSettings.currency]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    }).catch((err) => {
      console.error('Erro no logout', err);
    });
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
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-600" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-purple-600 dark:text-purple-400"
          onClick={() => setIsTipsOpen(true)}
          title="Ideias e Dicas (IA)"
        >
          <Lightbulb className="w-5 h-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-zinc-600 dark:text-zinc-400"
          onClick={handleToggleValues}
          title={userSettings.showValues ? 'Ocultar Valores' : 'Mostrar Valores'}
        >
          {userSettings.showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full relative h-8 w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Notificações">
            <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 rounded-2xl p-2 bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold text-zinc-900 dark:text-white px-3 py-2">
                Notificações
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <div className="max-h-80 overflow-y-auto scrollbar-none">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3 cursor-pointer rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <p className={`text-sm font-bold ${notif.color}`}>{notif.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{notif.description}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Info className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tudo em dia!</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Não há notificações no momento.</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:opacity-80 transition-opacity" title="Perfil do Usuário">
            <Avatar className="h-full w-full">
              <AvatarImage src={user?.photoURL || "https://github.com/shadcn.png"} alt="@user" />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
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
            <DropdownMenuItem 
              onClick={() => setIsLogoutDialogOpen(true)}
              className="rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2 text-zinc-500" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] bg-white dark:bg-[#1A1A1A] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Confirmar Saída
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-zinc-600 dark:text-zinc-300">Você realmente deseja sair do DINDIN? Sua sessão será encerrada agora.</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-0" 
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold border-0" 
              onClick={() => {
                setIsLogoutDialogOpen(false);
                handleLogout();
              }}
            >
              Sair agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
