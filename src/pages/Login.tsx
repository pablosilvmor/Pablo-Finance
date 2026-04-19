import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletIcon, Loader2, AlertCircle, Coins } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          navigate('/');
        }
        setLoading(false);
      }, (error) => {
        console.error("Auth state error:", error);
        setFirebaseError(true);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase not initialized properly", e);
      setFirebaseError(true);
      setLoading(false);
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    if (!auth || (auth as any).isDummy) {
      toast.error('Firebase não está configurado corretamente.');
      setFirebaseError(true);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = 'Erro ao fazer login com Google.';
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domínio não autorizado. Adicione este domínio no Console do Firebase.';
        setFirebaseError(true);
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = 'Chave de API do Firebase inválida.';
        setFirebaseError(true);
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'O login foi cancelado (janela fechada).';
      } else {
        errorMessage = `Erro (${error.code}): Verifique a configuração do Firebase.`;
        setFirebaseError(true);
      }
      
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white dark:bg-[#2c2c2e]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img 
              src="https://i.imgur.com/rltsQSg.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <CardTitle className="flex justify-center">
            <img 
              src="https://i.imgur.com/kJHoB4m.png" 
              alt="Dindin" 
              className="h-12 object-contain"
              referrerPolicy="no-referrer"
            />
          </CardTitle>
          <CardDescription>
            Gerencie suas finanças de forma inteligente
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {firebaseError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Problema de Configuração</p>
                <p>O Firebase não pôde autenticar. Isso pode ser devido a uma chave de API inválida ou domínio não autorizado no Console do Firebase.</p>
                <p className="mt-2 text-xs opacity-80">Dica: Se estiver no Vercel, adicione o domínio nas configurações de Autenticação do Firebase.</p>
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 h-12"
            onClick={handleGoogleLogin}
            disabled={firebaseError && !auth}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>

          <p className="text-xs text-center text-zinc-500 mt-6">
            Acesso administrativo restrito a{' '}
            <a 
              href="https://pablosilvmor.github.io/site/1" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-600 hover:underline font-semibold"
            >
              Pablo Moreira
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
