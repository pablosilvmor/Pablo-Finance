import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, ArrowRightLeft, Wallet, CreditCard, PieChart, Target, Settings, LogOut, Calculator, ShieldAlert, Calendar, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Tags, Hash, TrendingUp, UploadCloud, DownloadCloud, Bookmark, Tag, BarChart3, Coins, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '../lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { userSettings } = useAppStore();
  const { t } = useTranslation(userSettings.language);
  const { theme } = useTheme();

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
    auth.signOut();
  };

  const NavItem = ({ item, isSubmenu = false }: { item: any, isSubmenu?: boolean }) => {
    const isActive = location.pathname === item.path;
    const content = (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group",
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
            className="h-10 object-contain"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
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
              <DropdownMenuContent side="right" align="start" className="w-56 rounded-2xl p-2 bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800">
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

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                {!isCollapsed && (
                  <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Administração
                  </p>
                )}
              </div>
              <NavItem item={{ icon: ShieldAlert, label: 'Painel Admin', path: '/admin' }} />
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        {isCollapsed ? (
          <TooltipProvider delay={0}>
            <Tooltip>
              <TooltipTrigger render={
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center p-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#3d3d3e] w-full transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                </button>
              } />
              <TooltipContent side="right">{t('logout')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#3d3d3e] w-full transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {t('logout')}
            </button>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
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
          </div>
        )}
      </div>
    </aside>
  );
};
