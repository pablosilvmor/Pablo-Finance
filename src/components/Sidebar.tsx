import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, ArrowRightLeft, Wallet, CreditCard, PieChart, Target, Settings, LogOut, Calculator, ShieldAlert, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Tags, Hash, TrendingUp, UploadCloud, DownloadCloud, Bookmark, Tag, BarChart3, Coins, ClipboardList, Info, Sun, Moon, Lightbulb, Eye, EyeOff, Bell, Search, User, Share2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '../lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useTheme } from './ThemeProvider';
import { NewTransactionDialog } from './NewTransactionDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { userSettings, setIsTipsOpen, updateUserSettings, activeTransactions } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const { theme, setTheme } = useTheme();

  const isFemale = userSettings.gender === 'female' || (!userSettings.gender && userSettings.userName?.trim().split(' ')[0].toLowerCase().endsWith('a'));

  const mainNavItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: ArrowRightLeft, label: t('transactions'), path: '/transactions' },
    { icon: BarChart3, label: t('performance'), path: '/performance' },
    { icon: PieChart, label: t('charts'), path: '/charts' },
    { icon: Coins, label: t('piggyBank'), path: '/piggy-bank' },
    { icon: Target, label: t('goals'), path: '/goals' },
    { icon: ClipboardList, label: t('planning'), path: '/planning' },
  ];

  const moreItems = [
    { icon: Bookmark, label: t('categories'), path: '/categories' },
    { icon: Tag, label: t('tags'), path: '/tags' },
    { icon: Calendar, label: t('calendar'), path: '/calendar' },
    { icon: Calculator, label: t('calculators'), path: '/calculators' },
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'pablo.silvmor@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    }).catch((err) => {
      console.error('Erro no logout', err);
    });
  };

  const pendingAlerts = useMemo(() => {
    if (!activeTransactions) return 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return activeTransactions.filter(t => 
      t.status === 'pending' && new Date(t.date) <= today
    ).length;
  }, [activeTransactions]);

  const NavItem = ({ item, isSubmenu = false }: { item: any, isSubmenu?: boolean }) => {
    const isActive = location.pathname === item.path;
    const content = (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 hover:scale-[1.02] relative group",
          isActive 
            ? "text-purple-600 dark:text-[#c27aff] font-medium" 
            : "text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-[#3d3d3e]",
          isCollapsed && "justify-center px-0",
          isSubmenu && !isCollapsed && "ml-4"
        )}
      >
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-600 rounded-r-full" />
        )}
        <item.icon className={cn("w-5 h-5 shrink-0", isSubmenu && "w-4 h-4", isActive && "text-purple-600 dark:text-[#c27aff]")} />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delay={0}>
          <Tooltip>
            <TooltipTrigger render={content} />
            <TooltipContent side="right" className="flex items-center gap-4">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <aside className={cn(
      "bg-white dark:bg-[#2c2c2e] border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "justify-start")}>
        {isCollapsed ? (
          <img 
            src="https://i.imgur.com/rltsQSg.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img 
            src={theme === 'light' ? "https://i.imgur.com/6n9cYhs.png" : "https://i.imgur.com/kJHoB4m.png"} 
            alt="Dindin" 
            className="h-10 object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Welcome Message */}
      {!isCollapsed && userSettings.userName && (
        <div className="px-6 pb-4 text-center">
          <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            {isFemale ? 'Bem-vinda, ' : 'Bem-vindo, '}
            <span className="text-purple-600">{userSettings.userName.split(' ')[0]}</span>
          </span>
        </div>
      )}

      {/* Action Buttons: New Transaction, 4 small buttons, Search */}
      <div className="px-6 pb-6 space-y-4">
        <div className={cn(isCollapsed ? "flex justify-center" : "flex justify-center w-full [&>button]:w-full")}>
          <NewTransactionDialog isCollapsed={isCollapsed} />
        </div>
        
        {!isCollapsed && (
          <>
            {/* 4 buttons on the same line */}
            <div className="flex items-center justify-between px-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.1]"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.1] text-purple-600 dark:text-purple-400"
                onClick={() => {
                  setIsTipsOpen(true);
                }}
                title="Ideias e Dicas (IA)"
              >
                <Lightbulb className="w-4 h-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.1] text-zinc-600 dark:text-zinc-400"
                onClick={() => {
                  if (userSettings.showValues) {
                    updateUserSettings({ showValues: false });
                  } else {
                    window.dispatchEvent(new CustomEvent('open-privacy-password'));
                  }
                }}
                title={userSettings.showValues ? 'Ocultar Valores' : 'Mostrar Valores'}
              >
                {userSettings.showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full relative h-8 w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.1]" title="Notificações">
                  <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  {pendingAlerts > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 rounded-2xl p-2 bg-white dark:bg-[#2C2C2E] border-zinc-200 dark:border-zinc-800" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-bold text-zinc-900 dark:text-white px-3 py-2">
                      Notificações
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <div className="max-h-[300px] overflow-y-auto">
                    {activeTransactions.filter(t => t.status === 'pending' && new Date(t.date) <= (new Date(new Date().setHours(23, 59, 59, 999)))).length > 0 ? (
                      activeTransactions
                        .filter(t => t.status === 'pending' && new Date(t.date) <= (new Date(new Date().setHours(23, 59, 59, 999))))
                        .slice(0, 5)
                        .map((t, idx) => (
                          <DropdownMenuItem 
                            key={t.id} 
                            onSelect={() => navigate('/expenses')}
                            className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Pendente</span>
                              <span className="text-[10px] text-zinc-500">{new Date(t.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">{t.description}</p>
                            <p className="text-xs text-zinc-500">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}</p>
                          </DropdownMenuItem>
                        ))
                    ) : (
                      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                        <Info className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm font-medium">Sem novas notificações!</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Input */}
            <div 
              className="relative w-full cursor-pointer"
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <div 
                className="w-full h-9 pl-9 pr-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border-none text-sm flex items-center text-zinc-500 dark:text-zinc-400 select-none hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.02]"
              >
                Explorar...
              </div>
            </div>
            
            <div className="pt-2">
               <div className="border-b border-zinc-200 dark:border-zinc-800 w-full" />
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <nav className="space-y-1 px-3">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {/* Mais Menu */}
          <div className="pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton={false}
                render={
                  <div 
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#3d3d3e] cursor-pointer",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <MoreHorizontal className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>Mais opções</span>}
                    </div>
                  </div>
                }
              />
              <DropdownMenuContent side="right" align="start" className="w-56 rounded-2xl p-2 bg-white dark:bg-[#2C2C2E] border-zinc-200 dark:border-zinc-800">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.path} render={
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#3d3d3e] transition-colors cursor-pointer"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  } />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between p-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#3d3d3e] transition-colors" title="Perfil do Usuário">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={auth.currentUser?.photoURL || "https://github.com/shadcn.png"} alt="@user" />
                <AvatarFallback>{auth.currentUser?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-medium truncate text-zinc-900 dark:text-white">
                    {auth.currentUser?.displayName || 'Usuário'}
                  </span>
                  <span className="text-xs truncate text-zinc-500">
                    {auth.currentUser?.email || 'email@exemplo.com'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && <Settings className="w-4 h-4 shrink-0 text-zinc-400" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl p-2 bg-white dark:bg-[#2C2C2E] border-zinc-200 dark:border-zinc-800" align={isCollapsed ? "start" : "end"} side="right" sideOffset={16}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{auth.currentUser?.displayName || 'Usuário'}</p>
                  <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                    {auth.currentUser?.email || 'email@exemplo.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="space-y-1">
              <DropdownMenuItem 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-subscription'));
                }} 
                className="rounded-xl cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2 text-zinc-500" />
                Assinatura
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-share'));
                }} 
                className="rounded-xl cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-2 text-zinc-500" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  navigate('/settings');
                }} 
                className="rounded-xl cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2 text-zinc-500" />
                {t('settings')}
              </DropdownMenuItem>
              {auth.currentUser?.email === 'pablo.silvmor@gmail.com' && (
                <DropdownMenuItem 
                  onClick={() => {
                    navigate('/admin');
                  }} 
                  className="rounded-xl cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 mr-2 text-zinc-500" />
                  Painel Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-profile'));
                }} 
                className="rounded-xl cursor-pointer"
              >
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

        {!isCollapsed && (
          <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Desenvolvido por{" "}
              <a 
                href="https://pablosilvmor.github.io/site/1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline font-medium"
              >
                Pablo Moreira
              </a>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
