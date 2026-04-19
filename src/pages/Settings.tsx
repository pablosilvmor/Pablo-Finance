import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Layout, 
  Globe, 
  CreditCard, 
  Trash2, 
  Download, 
  Upload, 
  LogOut,
  Shield,
  Smartphone,
  Mail,
  Palette,
  Coins,
  Save
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export const Settings = () => {
  const user = auth.currentUser;
  const { theme, setTheme } = useTheme();
  const { userSettings, updateUserSettings } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(userSettings);
  const { t } = useTranslation(userSettings.language);

  useEffect(() => {
    setLocalSettings(userSettings);
  }, [userSettings]);

  const [selectedDevices, setSelectedDevices] = useState<string[]>(['1']);
  const devices = [
    { id: '1', name: 'Chrome Windows', location: 'Governador Valadares, Minas Gerais', current: true, lastSeen: 'agora' },
    { id: '2', name: 'Chrome Windows', location: 'Governador Valadares, Minas Gerais', current: false, lastSeen: 'há um dia' },
    { id: '3', name: 'iPhone 13', location: 'Governador Valadares, Minas Gerais', current: false, lastSeen: 'há 2 horas' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings(localSettings);
      if (localSettings.theme !== theme) {
        setTheme(localSettings.theme);
      }
      toast.success(t('settingsSaved'));
    } catch (error) {
      toast.error(t('settingsError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    toast.info('Sessão encerrada');
  };

  const handleEmailChange = () => {
    toast.info('Um link de confirmação foi enviado para o seu e-mail atual.');
  };

  const handlePasswordChange = () => {
    toast.info('Um link para redefinição de senha foi enviado para o seu e-mail.');
  };

  const updateNestedSetting = (path: string, value: any) => {
    setLocalSettings(prev => {
      const keys = path.split('.');
      const next = { ...prev };
      let current: any = next;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const toggleDashboardCard = (side: 'left' | 'right', cardId: string) => {
    setLocalSettings(prev => {
      const sideKey = `${side}Cards` as 'leftCards' | 'rightCards';
      const dashboard = prev.dashboard || { leftCards: [], rightCards: [] };
      const currentCards = dashboard[sideKey] || [];
      const newCards = currentCards.includes(cardId)
        ? currentCards.filter(id => id !== cardId)
        : [...currentCards, cardId];
      
      return {
        ...prev,
        dashboard: {
          ...dashboard,
          [sideKey]: newCards
        }
      };
    });
  };

  const toggleSelectAllDevices = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(devices.map(d => d.id));
    } else {
      setSelectedDevices(['1']); // Keep current device
    }
  };

  const toggleDevice = (id: string) => {
    if (id === '1') return; // Cannot deselect current device
    setSelectedDevices(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('settings')}</h1>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <div className="flex justify-end mb-8 overflow-x-auto pb-2">
          <TabsList className="bg-secondary rounded-full p-1 h-12 inline-flex min-w-max border border-border">
            <TabsTrigger value="preferences" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8 transition-all">
              {t('preferences')}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8 transition-all">
              {t('alertsAndNotifications')}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8 transition-all">
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-8 transition-all">
              {t('security')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preferences">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
            <CardContent className="p-0 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{t('language')}</Label>
                  <Select 
                    value={localSettings.language || 'pt-BR'} 
                    onValueChange={(v) => updateNestedSetting('language', v)}
                  >
                    <SelectTrigger className="border-none border-b border-border bg-transparent rounded-none h-12 px-0 font-bold text-lg focus:ring-0 focus:border-primary transition-colors shadow-none">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português Brasil</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{t('currency')}</Label>
                  <Select 
                    value={localSettings.currency || 'BRL'} 
                    onValueChange={(v) => updateNestedSetting('currency', v)}
                  >
                    <SelectTrigger className="border-none border-b border-border bg-transparent rounded-none h-12 px-0 font-bold text-lg focus:ring-0 focus:border-primary transition-colors shadow-none">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Brasil (R$)</SelectItem>
                      <SelectItem value="USD">USA ($)</SelectItem>
                      <SelectItem value="EUR">Europe (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{t('appearance')}</Label>
                  <Select 
                    value={localSettings.theme || 'system'} 
                    onValueChange={(v: any) => updateNestedSetting('theme', v)}
                  >
                    <SelectTrigger className="border-none border-b border-border bg-transparent rounded-none h-12 px-0 font-bold text-lg focus:ring-0 focus:border-primary transition-colors shadow-none">
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('lightMode')}</SelectItem>
                      <SelectItem value="dark">{t('darkMode')}</SelectItem>
                      <SelectItem value="system">{t('system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 h-12 font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
                >
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
            <CardContent className="p-0 space-y-10">
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-foreground">{t('email')}</h3>
                
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <span className="text-lg font-bold">{t('receiveNotifications')}</span>
                  <Switch 
                    checked={Object.values(localSettings.notifications.email).some(v => v)} 
                    onCheckedChange={(checked) => {
                      const newEmail = { ...localSettings.notifications.email };
                      Object.keys(newEmail).forEach(k => (newEmail as any)[k] = checked);
                      updateNestedSetting('notifications.email', newEmail);
                    }}
                    className="data-[state=checked]:bg-primary" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-10">
                  {[
                    { key: 'news', title: t('newsTitle'), desc: t('newsDesc') },
                    { key: 'premium', title: t('premiumTitle'), desc: t('premiumDesc') },
                    { key: 'alerts', title: t('alertsTitle'), desc: t('alertsDesc') },
                    { key: 'partners', title: t('partnersTitle'), desc: t('partnersDesc') }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-6">
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-lg">{item.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={(localSettings.notifications.email as any)[item.key]}
                        onCheckedChange={(v) => updateNestedSetting(`notifications.email.${item.key}`, v)}
                        className="mt-1 data-[state=checked]:bg-primary" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-10 h-12 font-bold uppercase tracking-wider shadow-lg shadow-purple-600/20"
                >
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
            <CardContent className="p-0 space-y-10">
              <h3 className="text-lg font-bold text-foreground">{t('dashboardCardsQuestion')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground text-sm mb-6">{t('leftCards')}</p>
                  {[
                    { id: 'category-expenses', label: t('showCategoryExpenses') },
                    { id: 'spending-frequency', label: t('showSpendingFrequency') },
                    { id: 'balance-monthly', label: t('showBalanceMonthly') },
                    { id: 'pending-transactions', label: t('showPendingTransactions') },
                    { id: 'budget-summary', label: t('showBudgetSummary') },
                    { id: 'savings-info', label: t('showSavingsInfo') },
                    { id: 'accounts', label: t('showAccounts') }
                  ].map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleDashboardCard('left', item.id)}
                      className="flex items-center gap-4 p-5 bg-secondary rounded-3xl hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <Checkbox 
                        id={`left-${item.id}`} 
                        checked={localSettings.dashboard.leftCards.includes(item.id)} 
                        onCheckedChange={() => {}} // Controlled by parent div
                        className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none" 
                      />
                      <label 
                        htmlFor={`left-${item.id}`} 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-center text-muted-foreground text-sm mb-6">{t('rightCards')}</p>
                  {[
                    { id: 'category-incomes', label: t('showCategoryIncomes') },
                    { id: 'balance-semester', label: t('showBalanceSemester') },
                    { id: 'balance-quarter', label: t('showBalanceQuarter') },
                    { id: 'credit-card', label: t('showCreditCard') },
                    { id: 'goals', label: t('showGoals') },
                    { id: 'profile-info', label: t('showProfileInfo') }
                  ].map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleDashboardCard('right', item.id)}
                      className="flex items-center gap-4 p-5 bg-secondary rounded-3xl hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <Checkbox 
                        id={`right-${item.id}`} 
                        checked={localSettings.dashboard.rightCards.includes(item.id)} 
                        onCheckedChange={() => {}} // Controlled by parent div
                        className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none" 
                      />
                      <label 
                        htmlFor={`right-${item.id}`} 
                        className="text-sm font-medium cursor-pointer flex-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-10 h-12 font-bold uppercase tracking-wider shadow-lg shadow-purple-600/20"
                >
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
            <CardContent className="p-0 space-y-10">
              <div className="space-y-6">
                <h3 className="text-xl font-bold">{t('changeEmail')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {t('changeEmailDesc')}
                </p>
                <Button 
                  onClick={handleEmailChange}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 h-12 font-bold uppercase tracking-wider"
                >
                  {t('changeEmailBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
            <CardContent className="p-0 space-y-6">
              <h3 className="text-xl font-bold">{t('changePassword')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('changePasswordDesc')}
              </p>
              <Button 
                onClick={handlePasswordChange}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 h-12 font-bold uppercase tracking-wider"
              >
                {t('changePasswordBtn')}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold px-4">{t('connectedDevices')}</h3>
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-card p-10">
              <CardContent className="p-0 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold">{t('myDevices')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('devicesDesc')}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <Checkbox 
                      id="select-all" 
                      className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      checked={selectedDevices.length === devices.length}
                      onCheckedChange={(checked) => toggleSelectAllDevices(!!checked)}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">{t('selectAll')}</label>
                  </div>

                  <div className="space-y-6 pt-6">
                    {devices.map((device) => (
                      <div 
                        key={device.id} 
                        onClick={() => toggleDevice(device.id)}
                        className="flex items-center justify-between p-4 rounded-3xl hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {device.current ? (
                            <div className="w-5 h-5" />
                          ) : (
                            <Checkbox 
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={() => toggleDevice(device.id)}
                              className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                            />
                          )}
                          <div className="p-3 rounded-2xl bg-secondary">
                            <Smartphone className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              {device.name} 
                              {device.current && (
                                <span className="text-primary text-xs font-normal ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                                  {t('currentDevice')}
                                </span>
                              )}
                              {!device.current && (
                                <span className="text-muted-foreground text-xs font-normal ml-2">{device.lastSeen}</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{device.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full gap-2 h-14 px-10 font-bold"
            >
              <LogOut className="w-5 h-5" /> {t('logoutAll')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
