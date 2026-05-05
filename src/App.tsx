import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider } from './lib/store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Calculators } from './pages/Calculators';
import { Goals } from './pages/Goals';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { CalendarView } from './pages/CalendarView';
import { Categories } from './pages/Categories';
import { Reports } from './pages/Reports';
import { Planning } from './pages/Planning';
import { Expenses } from './pages/Expenses';
import { Incomes } from './pages/Incomes';
import { Settings } from './pages/Settings';
import { Tags } from './pages/Tags';
import { CostCenters } from './pages/CostCenters';
import { Performance } from './pages/Performance';
import { Charts } from './pages/Charts';
import { PiggyBankPage } from './pages/PiggyBankPage';
import { Splits } from './pages/Splits';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, db } from './lib/firebase';
import { Loader2, Clock, LogOut, ShieldAlert } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Preloader } from './components/Preloader';

const PendingApproval = ({ user }: { user: any }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#2c2c2e] rounded-[2.5rem] p-8 shadow-xl text-center space-y-6 border border-zinc-200 dark:border-zinc-800">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Clock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Acesso Pendente</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Olá, <span className="font-semibold text-zinc-900 dark:text-white">{user.displayName}</span>! 
            Sua conta está aguardando aprovação do administrador (Pablo Moreira).
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-sm text-zinc-500">
          Você receberá acesso assim que sua conta for revisada.
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 mx-auto text-zinc-500 hover:text-red-500 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
};

const RejectedAccess = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#2c2c2e] rounded-[2.5rem] p-8 shadow-xl text-center space-y-6 border border-zinc-200 dark:border-zinc-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Acesso Recusado</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Infelizmente seu acesso ao sistema não foi aprovado pelo administrador.
          </p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 mx-auto text-zinc-500 hover:text-red-500 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        try {
          setUser(user);
          if (user && db) {
            // Check profile status
            const profileRef = doc(db, 'users_profiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            
            if (profileSnap.exists()) {
              setStatus(profileSnap.data().status);
            } else {
              // Auto-approve Pablo
              const initialStatus = user.email === 'pablo.silvmor@gmail.com' ? 'approved' : 'pending';
              const newProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                status: initialStatus,
                createdAt: new Date().toISOString()
              };
              await setDoc(profileRef, newProfile);
              setStatus(initialStatus);
            }
          }
        } catch (error) {
          console.error("Error checking profile status:", error);
          // Fallback or error state could be set here
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error("Auth state error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase not initialized", e);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (status === 'pending') {
    return <PendingApproval user={user} />;
  }

  if (status === 'rejected') {
    return <RejectedAccess />;
  }

  return <>{children}</>;
};

import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="dindin-theme">
        <TooltipProvider>
          <AppProvider>
            {isPreloaderVisible && <Preloader onComplete={() => setIsPreloaderVisible(false)} />}
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="admin" element={<Admin />} />
                  <Route path="calendar" element={<CalendarView />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="planning" element={<Planning />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="incomes" element={<Incomes />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="tags" element={<Tags />} />
                  <Route path="cost-centers" element={<CostCenters />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="piggy-bank" element={<PiggyBankPage />} />
                  <Route path="splits" element={<Splits />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </AppProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
