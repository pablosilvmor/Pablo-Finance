import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth, db } from '../lib/firebase';
import { ShieldAlert, Users, Activity, Check, X, Trash2, Clock, UserCheck, UserX } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      } else if (user.email === 'pablo.silvmor@gmail.com') {
        setIsAdmin(true);
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users_profiles'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });

    return () => unsubscribeUsers();
  }, [isAdmin]);

  const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users_profiles', userId), { status });
      toast.success(`Usuário ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status do usuário.");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === 'pablo.silvmor@gmail.com') {
      toast.error("Você não pode excluir o administrador principal.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este usuário? Todos os dados dele serão mantidos no banco, mas o acesso será removido.")) return;

    try {
      await deleteDoc(doc(db, 'users_profiles', userId));
      toast.success("Perfil de acesso excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário.");
    }
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Acesso Negado</h2>
        <p className="text-zinc-500">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Painel Administrativo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-[#2c2c2e]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total de Usuários</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{users.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-[#2c2c2e]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Pendentes</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{pendingUsers.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-[#2c2c2e]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Aprovados</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{approvedUsers.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-[#2c2c2e] overflow-hidden">
        <CardHeader className="px-8 pt-8">
          <CardTitle>Gerenciamento de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-center py-8 text-zinc-500">Nenhum usuário registrado.</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((user) => (
                  <div key={user.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-zinc-100 dark:border-zinc-800">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-bold">
                          {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-zinc-900 dark:text-white">{user.displayName || 'Usuário sem nome'}</p>
                          {user.email === 'pablo.silvmor@gmail.com' && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[10px] rounded-full font-bold uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            user.status === 'approved' ? "bg-green-100 text-green-600" :
                            user.status === 'rejected' ? "bg-red-100 text-red-600" :
                            "bg-amber-100 text-amber-600"
                          )}>
                            {user.status === 'approved' ? 'Aprovado' : 
                             user.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.email !== 'pablo.silvmor@gmail.com' && (
                        <>
                          {user.status !== 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20"
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                            >
                              <Check className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                          )}
                          {user.status !== 'rejected' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/30 dark:hover:bg-amber-900/20"
                              onClick={() => handleUpdateStatus(user.id, 'rejected')}
                            >
                              <X className="w-4 h-4 mr-1" /> Rejeitar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { cn } from '@/lib/utils';
