import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  LayoutDashboard, 
  ArrowRightLeft, 
  Target, 
  PiggyBank, 
  PieChart, 
  Activity, 
  Scale, 
  Calendar,
  CreditCard,
  Globe,
  Tag,
  Flag,
  Upload,
  Download,
  Layout,
  Calculator,
  Settings,
  HelpCircle,
  ShieldAlert,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router';
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';
import { ShareDialog } from './ShareDialog';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreMenu = ({ isOpen, onClose }: MobileMoreMenuProps) => {
  const [activeTab, setActiveTab] = useState<'GERENCIAR' | 'GERAL' | 'SOBRE'>('GERENCIAR');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const manageItems = [
    { icon: Calculator, label: 'Calculadoras', path: '/calculators' },
    { icon: Layout, label: 'Categorias', path: '/categories' },
    { icon: Flag, label: 'Objetivos', path: '/goals' },
    { icon: Tag, label: 'Tags', path: '/tags' },
  ];

  if (userEmail === 'pablo.silvmor@gmail.com') {
    manageItems.push({ icon: ShieldAlert, label: 'Painel Admin', path: '/admin' });
    manageItems.sort((a, b) => a.label.localeCompare(b.label));
  } else {
    manageItems.sort((a, b) => a.label.localeCompare(b.label));
  }

  const generalItems = [
    { icon: Scale, label: 'Balanço mensal', path: '/reports' },
    { icon: Calendar, label: 'Calendário', path: '/calendar' },
    { icon: PieChart, label: 'Gráficos', path: '/charts' },
    { icon: Activity, label: 'Meu Desempenho', path: '/performance' },
  ].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-[#1C1C1E] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Mais opções</h2>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsShareOpen(true)}>
                <Share2 className="w-6 h-6 text-zinc-400" />
              </button>
              <Link to="/settings" onClick={onClose}>
                <Settings className="w-6 h-6 text-zinc-400" />
              </Link>
              <HelpCircle className="w-6 h-6 text-zinc-400" />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 mb-6">
            <div className="bg-zinc-800/50 p-1 rounded-2xl flex">
              {(['GERENCIAR', 'GERAL', 'SOBRE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold rounded-xl transition-all",
                    activeTab === tab 
                      ? "bg-zinc-700 text-purple-400 shadow-lg" 
                      : "text-zinc-500"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="bg-[#2C2C2E] rounded-[2.5rem] overflow-hidden">
              {activeTab === 'GERENCIAR' && (
                <div className="divide-y divide-zinc-800">
                  {manageItems.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.path} 
                      onClick={onClose}
                      className="flex items-center gap-4 p-5 hover:bg-zinc-800/50 transition-colors"
                    >
                      <item.icon className="w-6 h-6 text-zinc-400" />
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === 'GERAL' && (
                <div className="divide-y divide-zinc-800">
                  {generalItems.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.path} 
                      onClick={onClose}
                      className="flex items-center gap-4 p-5 hover:bg-zinc-800/50 transition-colors"
                    >
                      <item.icon className="w-6 h-6 text-zinc-400" />
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === 'SOBRE' && (
                <div className="p-8 text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <img 
                      src="https://i.imgur.com/rltsQSg.png" 
                      alt="Logo" 
                      className="w-20 h-20 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src="https://i.imgur.com/kJHoB4m.png" 
                      alt="Dindin" 
                      className="h-10 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-zinc-500 text-sm">Versão 2.4.0</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Seu assistente financeiro pessoal completo para gestão de gastos, metas e investimentos.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Close Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button 
              onClick={onClose}
              className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
