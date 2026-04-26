import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LayoutDashboard, ArrowRightLeft, Target, MoreHorizontal, Plus, Calendar, PiggyBank, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionMenuOverlay } from './TransactionMenuOverlay';
import { NewTransactionDialog } from './NewTransactionDialog';
import { TipsOverlay } from './TipsOverlay';
import { MobileMoreMenu } from './MobileMoreMenu';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'expense' | 'income'>('expense');

  const handleMenuSelect = (type: 'expense' | 'income' | 'piggy-bank') => {
    setIsMenuOpen(false);
    if (type === 'piggy-bank') {
      navigate('/piggy-bank');
    } else {
      setNewTransactionType(type);
      setIsNewTransactionOpen(true);
    }
  };

  const bottomNavItems = [
    { icon: LayoutDashboard, label: 'Principal', path: '/' },
    { icon: ArrowRightLeft, label: 'Transações', path: '/transactions' },
    { icon: Calculator, label: 'Calculadoras', path: '/calculators' },
    { icon: MoreHorizontal, label: 'Mais', path: '/more' },
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      </div>
      <div className={cn(
        "flex-1 flex flex-col w-full h-screen transition-all duration-300 ease-in-out relative overflow-hidden",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 relative overflow-y-auto overflow-x-hidden">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center h-16 px-1 z-50">
        {bottomNavItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1",
                isActive ? "text-purple-600" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}

        <div className="relative -top-6">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors",
              location.pathname === '/expenses' 
                ? "bg-red-500 shadow-red-500/30 hover:bg-red-600" 
                : location.pathname === '/incomes'
                  ? "bg-green-500 shadow-green-500/30 hover:bg-green-600"
                  : "bg-purple-600 shadow-purple-600/30 hover:bg-purple-700"
            )}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {bottomNavItems.slice(2).map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.label === 'Mais') {
            return (
              <button
                key="more"
                onClick={() => setIsMoreMenuOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-full gap-1",
                  isMoreMenuOpen ? "text-purple-600" : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1",
                isActive ? "text-purple-600" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <TransactionMenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={handleMenuSelect} 
      />

      <MobileMoreMenu 
        isOpen={isMoreMenuOpen} 
        onClose={() => setIsMoreMenuOpen(false)} 
      />

      <NewTransactionDialog 
        open={isNewTransactionOpen} 
        onOpenChange={setIsNewTransactionOpen} 
        initialType={newTransactionType}
      />

      <TipsOverlay />
    </div>
  );
};
