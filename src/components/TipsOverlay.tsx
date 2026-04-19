import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  X, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

interface Tip {
  title: string;
  description: string;
}

const tipsData: Record<string, Tip[]> = {
  '/dashboard': [
    { title: '📊 Visão Geral', description: 'Este é o seu centro de comando. Aqui você vê um resumo rápido de sua saúde financeira no mês atual, incluindo saldo total, receitas e despesas.' },
    { title: '⚙️ Personalização', description: 'Sabia que você pode escolher quais cards aparecem aqui? Vá em Configurações para deixar o Dashboard com a sua cara!' },
    { title: '⚖️ Balanço Mensal', description: 'O gráfico de barras mostra a relação entre o que entra e o que sai. Mantenha a barra verde sempre maior que a vermelha!' }
  ],
  '/transactions': [
    { title: '🔍 Filtros Rápidos', description: 'Use os botões de Despesas e Receitas no topo para filtrar rapidamente sua lista e encontrar o que procura.' },
    { title: '✅ Status da Transação', description: 'Clique no ícone de check para marcar uma transação como paga ou pendente. Isso ajuda a manter seu saldo real atualizado.' },
    { title: '✏️ Edição e Exclusão', description: 'Precisa ajustar algo? Clique em qualquer transação para editar seus detalhes ou excluí-la permanentemente.' }
  ],
  '/planning': [
    { title: '📝 Defina seu Orçamento', description: 'O segredo do sucesso financeiro é o planejamento. Defina quanto você pretende gastar em cada categoria no início do mês.' },
    { title: '📈 Acompanhamento', description: 'A barra de progresso colorida mostra quanto do orçamento você já utilizou. Fique de olho para não ultrapassar o limite!' },
    { title: '💰 Economia Projetada', description: 'O sistema calcula automaticamente quanto você pode economizar se seguir seu plano à risca. Meta de economia é vida!' }
  ],
  '/piggy-bank': [
    { title: '🏦 Saldos Bancários', description: 'Mantenha seus saldos atualizados em cada conta para ter uma visão real e consolidada do seu patrimônio total.' },
    { title: '📥 Histórico de Depósitos', description: 'Registre seus aportes mensais. Ver o gráfico de crescimento ao longo do tempo é a melhor motivação para poupar.' },
    { title: '🍕 Gráfico de Distribuição', description: 'Veja como seu dinheiro está distribuído. Diversificar entre diferentes instituições pode ser uma boa estratégia de segurança.' }
  ],
  '/goals': [
    { title: '🎯 Metas Claras', description: 'Crie objetivos específicos (ex: Viagem, Carro Novo) com valores e datas. Metas com nome e prazo são muito mais fáceis de alcançar!' },
    { title: '🚀 Progresso Automático', description: 'Acompanhe a barra de progresso de cada meta. O sistema mostra exatamente quanto falta e qual a porcentagem já concluída.' },
    { title: '🔝 Priorização', description: 'Foque nas metas com prazos mais próximos ou que são mais importantes para você no momento.' }
  ],
  '/settings': [
    { title: '🛠️ Preferências', description: 'Ajuste o idioma, a moeda e o tema visual (Claro ou Escuro) para que o app fique confortável para você.' },
    { title: '🔔 Notificações', description: 'Escolha quais alertas você deseja receber. Avisos de contas a vencer podem te salvar de pagar juros desnecessários!' },
    { title: '🔒 Segurança', description: 'Sua privacidade é nossa prioridade. Gerencie suas configurações de segurança e mantenha seus dados sempre protegidos.' },
    { title: '👁️ Senha de Exibição', description: 'A senha de exibição (padrão: 0000) protege seus valores. Para alterá-la, vá em Perfil ou Configurações, digite a senha atual e defina uma nova.' }
  ]
};

export const TipsOverlay = () => {
  const location = useLocation();
  const { userSettings, updateUserSettings, isTipsOpen, setIsTipsOpen, isDataLoaded } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  const currentPath = location.pathname;
  const tips = tipsData[currentPath] || tipsData['/dashboard'];

  useEffect(() => {
    setCurrentStep(0);
  }, [currentPath]);

  if (!isDataLoaded) return null;
  if (!isTipsOpen) return null;

  const handleNext = () => {
    if (currentStep < tips.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsTipsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleHideTips = () => {
    updateUserSettings({ showTips: false });
    setIsTipsOpen(false);
  };

  return (
    <>
      {/* Overlay Modal */}
      <AnimatePresence>
        {isTipsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-[#1C1C1E] overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-purple-600">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                        <Info className="w-5 h-5" />
                      </div>
                      <span className="font-bold uppercase tracking-wider text-sm">Dica {currentStep + 1} de {tips.length}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setIsTipsOpen(false);
                      }}
                      className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-4 min-h-[120px]">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {tips[currentStep].title}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-lg">
                      {tips[currentStep].description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {tips.map((_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentStep ? 'w-8 bg-purple-600' : 'w-2 bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="rounded-full gap-2 px-6"
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 gap-2 font-bold"
                      >
                        {currentStep === tips.length - 1 ? (
                          <>Entendi <CheckCircle2 className="w-4 h-4" /></>
                        ) : (
                          <>Próximo <ChevronRight className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
