import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, Category, CreditCard, Goal, MonthlyPlan, TransactionStatus, Tag } from '../types';
import { isSameMonth, isSameYear } from 'date-fns';
import { db, auth } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, getDoc } from 'firebase/firestore';

export interface PiggyBankEntry {
  bank: string;
  balance: number;
  color: string;
}

export interface PiggyBankHistory {
  date: string;
  amount: number;
  bank?: string;
  type?: 'deposit' | 'withdrawal' | 'transfer';
  toBank?: string;
}

export interface UserSettings {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: {
      news: boolean;
      premium: boolean;
      alerts: boolean;
      partners: boolean;
    };
    push: {
      daily: boolean;
      reminder: boolean;
      limit: boolean;
      security: boolean;
    };
  };
  dashboard: {
    leftCards: string[];
    rightCards: string[];
  };
  showValues: boolean;
  showTips: boolean;
  privacyPassword: string;
  userName?: string;
  gender?: 'male' | 'female' | 'neutral';
  favoriteCalculators?: string[];
}

interface AppState {
  transactions: Transaction[];
  activeTransactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  goals: Goal[];
  monthlyPlan: MonthlyPlan;
  piggyBank: PiggyBankEntry[];
  piggyBankHistory: PiggyBankHistory[];
  userSettings: UserSettings;
  isTipsOpen: boolean;
  isDataLoaded: boolean;
  setIsTipsOpen: (open: boolean) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  bulkDeleteGoals: (ids: string[]) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  bulkDeleteCategories: (ids: string[]) => Promise<void>;
  addTag: (t: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, t: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  bulkDeleteTags: (ids: string[]) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  bulkUpdateTransactions: (updates: { id: string; data: Partial<Transaction> }[]) => Promise<void>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  bulkUpsertTransactions: (transactions: Transaction[]) => Promise<void>;
  upsertTransaction: (t: Transaction) => Promise<void>;
  findTransaction: (description: string, categoryId: string, type: string, date: string, groupId?: string) => Transaction | undefined;
  removeDuplicateTransactions: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setTransactions: (t: Transaction[]) => void;
  setCategories: (c: Category[]) => void;
  setGoals: (g: Goal[]) => void;
  updateMonthlyPlan: (p: Partial<MonthlyPlan>) => Promise<void>;
  updatePiggyBank: (bank: string, balance: number, color?: string) => Promise<void>;
  bulkUpdatePiggyBank: (updates: { bank: string; balance: number; color?: string }[]) => Promise<void>;
  addPiggyBank: (bank: string, color: string) => Promise<void>;
  deletePiggyBank: (bank: string) => Promise<void>;
  resetPiggyBankBalance: (bank: string) => Promise<void>;
  addPiggyBankTransaction: (amount: number, date: string, bank: string, type: 'deposit' | 'withdrawal' | 'transfer', toBank?: string) => Promise<void>;
  updatePiggyBankDeposit: (index: number, amount: number, date: string, bank: string, type?: 'deposit' | 'withdrawal' | 'transfer', toBank?: string) => Promise<void>;
  deletePiggyBankDeposit: (index: number) => Promise<void>;
  updateUserSettings: (s: Partial<UserSettings>) => Promise<void>;
}

const initialCategories: Category[] = [
  // Despesas
  { id: '1', name: 'Alimentação', type: 'expense', color: '#FF3B30', icon: 'shopping-cart' },
  { id: '2', name: 'Assinatura', type: 'expense', color: '#AF52DE', icon: 'credit-card' },
  { id: '3', name: 'Casa', type: 'expense', color: '#007AFF', icon: 'home' },
  { id: '4', name: 'Compras', type: 'expense', color: '#AF52DE', icon: 'shopping-bag' },
  { id: '5', name: 'Educação', type: 'expense', color: '#AF52DE', icon: 'book' },
  { id: '6', name: 'Eletrônicos', type: 'expense', color: '#FFCC00', icon: 'monitor' },
  { id: '7', name: 'Internet', type: 'expense', color: '#007AFF', icon: 'wifi' },
  { id: '8', name: 'Lazer', type: 'expense', color: '#FF9500', icon: 'smile' },
  { id: '9', name: 'Operação bancária', type: 'expense', color: '#AF52DE', icon: 'credit-card' },
  { id: '10', name: 'Outros', type: 'expense', color: '#8E8E93', icon: 'more-horizontal' },
  { id: '11', name: 'Pix', type: 'expense', color: '#AF52DE', icon: 'zap' },
  { id: '12', name: 'Saúde', type: 'expense', color: '#34C759', icon: 'briefcase' },
  { id: '13', name: 'Serviços', type: 'expense', color: '#248A3D', icon: 'clipboard' },
  { id: '14', name: 'Supermercado', type: 'expense', color: '#FF3B30', icon: 'shopping-cart' },
  { id: '15', name: 'Transporte', type: 'expense', color: '#007AFF', icon: 'car' },
  { id: '16', name: 'Vestuário', type: 'expense', color: '#AF52DE', icon: 'shirt' },
  { id: '17', name: 'Viagem', type: 'expense', color: '#007AFF', icon: 'plane' },

  // Receitas
  { id: '18', name: 'Bonificação', type: 'income', color: '#AF52DE', icon: 'star' },
  { id: '19', name: 'Empréstimo', type: 'income', color: '#AF52DE', icon: 'credit-card' },
  { id: '20', name: 'Investimento', type: 'income', color: '#007AFF', icon: 'trending-up' },
  { id: '21', name: 'Outros', type: 'income', color: '#AF52DE', icon: 'more-horizontal' },
  { id: '22', name: 'Pix', type: 'income', color: '#AF52DE', icon: 'zap' },
  { id: '23', name: 'Presente', type: 'income', color: '#34C759', icon: 'gift' },
  { id: '24', name: 'Renda extra', type: 'income', color: '#AF52DE', icon: 'credit-card' },
  { id: '25', name: 'Salário', type: 'income', color: '#FF3B30', icon: 'briefcase' },
  { id: '26', name: 'Transferência bancária', type: 'income', color: '#AF52DE', icon: 'credit-card' }
];

const initialMonthlyPlan: MonthlyPlan = {
  income: 0,
  savingsPercentage: 0,
  budgets: []
};

const initialPiggyBank: PiggyBankEntry[] = [
  { bank: 'Nubank', balance: 0, color: '#8B5CF6' },
  { bank: 'Inter', balance: 0, color: '#FF9500' },
  { bank: 'Mercado Pago', balance: 0, color: '#007AFF' },
  { bank: 'Itaú', balance: 0, color: '#FF3B30' },
  { bank: 'Bradesco', balance: 0, color: '#34C759' },
  { bank: 'Santander', balance: 0, color: '#AF52DE' },
  { bank: 'Caixa', balance: 0, color: '#6b7280' },
  { bank: 'BB', balance: 0, color: '#3b82f6' },
  { bank: 'C6 Bank', balance: 0, color: '#ef4444' },
  { bank: 'XP', balance: 0, color: '#f59e0b' },
  { bank: 'BTG', balance: 0, color: '#01bfa5' },
];

const initialUserSettings: UserSettings = {
  language: 'pt-BR',
  currency: 'BRL',
  theme: 'system',
  notifications: {
    email: { news: true, premium: true, alerts: true, partners: true },
    push: { daily: true, reminder: true, limit: true, security: true }
  },
  dashboard: {
    leftCards: ['category-expenses', 'balance-monthly', 'pending-transactions', 'budget-summary'],
    rightCards: ['category-incomes', 'credit-card']
  },
  showValues: true,
  showTips: false,
  privacyPassword: '0000',
  userName: '',
  favoriteCalculators: []
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>(initialCategories);
  const [tags, setTagsState] = useState<Tag[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [monthlyPlan, setMonthlyPlanState] = useState<MonthlyPlan>(initialMonthlyPlan);
  const [piggyBank, setPiggyBankState] = useState<PiggyBankEntry[]>(initialPiggyBank);
  const [piggyBankHistory, setPiggyBankHistoryState] = useState<PiggyBankHistory[]>([]);
  const [userSettings, setUserSettingsState] = useState<UserSettings>(initialUserSettings);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // If we have a user, the Firestore listeners will handle the state
    if (userId) return;

    // No user, reset to initial state (guest mode disabled per user request)
    setTransactionsState([]);
    setCategoriesState(initialCategories);
    setTagsState([]);
    setGoalsState([]);
    setMonthlyPlanState(initialMonthlyPlan);
    setPiggyBankState(initialPiggyBank);
    setPiggyBankHistoryState([]);
    setUserSettingsState(initialUserSettings);
  }, [userId]);

  useEffect(() => {
    if (!userId || !db) return;

    const unsubTransactions = onSnapshot(collection(db, `users/${userId}/transactions`), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactionsState(data);
    });

    const unsubCategories = onSnapshot(collection(db, `users/${userId}/categories`), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Category);
      if (data.length > 0) {
        setCategoriesState(data);
      } else {
        // Initialize default categories
        initialCategories.forEach(cat => {
          setDoc(doc(db, `users/${userId}/categories`, cat.id), cat);
        });
      }
    });

    const unsubGoals = onSnapshot(collection(db, `users/${userId}/goals`), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Goal);
      setGoalsState(data);
    });

    const unsubTags = onSnapshot(collection(db, `users/${userId}/tags`), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Tag);
      setTagsState(data);
    });

    const unsubUserData = onSnapshot(doc(db, `users/${userId}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.monthlyPlan) setMonthlyPlanState(data.monthlyPlan);
        if (data.piggyBank) setPiggyBankState(data.piggyBank);
        if (data.piggyBankHistory) setPiggyBankHistoryState(data.piggyBankHistory);
        if (data.userSettings) {
          setUserSettingsState(data.userSettings);
        }
        setIsDataLoaded(true);
      } else {
        // Initialize user data
        setDoc(doc(db, `users/${userId}`), {
          monthlyPlan: initialMonthlyPlan,
          piggyBank: initialPiggyBank,
          piggyBankHistory: [],
          userSettings: initialUserSettings
        });
        setIsDataLoaded(true);
      }
    });

    return () => {
      unsubTransactions();
      unsubCategories();
      unsubGoals();
      unsubTags();
      unsubUserData();
    };
  }, [userId]);

  const updateUserData = async (data: any) => {
    if (!userId || !db) return;
    
    // Remove undefined values to prevent Firestore errors
    const cleanData = JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
    
    try {
      await setDoc(doc(db, `users/${userId}`), cleanData, { merge: true });
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!userId || !db) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newTransaction = { ...t, id };
    await setDoc(doc(db, `users/${userId}/transactions`, id), newTransaction);
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    if (!userId || !db) return;
    await updateDoc(doc(db, `users/${userId}/transactions`, id), t);
  };

  const bulkUpdateTransactions = async (updates: { id: string; data: Partial<Transaction> }[]) => {
    if (!userId || !db || updates.length === 0) return;
    const batch = writeBatch(db);
    updates.forEach(update => {
      batch.update(doc(db, `users/${userId}/transactions`, update.id), update.data);
    });
    await batch.commit();
  };

  const bulkDeleteTransactions = async (ids: string[]) => {
    if (!userId || !db || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, `users/${userId}/transactions`, id));
    });
    await batch.commit();
  };

  const bulkUpsertTransactions = async (ts: Transaction[]) => {
    if (!userId || !db || ts.length === 0) return;
    const batch = writeBatch(db);
    ts.forEach(t => {
      batch.set(doc(db, `users/${userId}/transactions`, t.id), t);
    });
    await batch.commit();
  };

  const upsertTransaction = async (t: Transaction) => {
    if (!userId || !db) return;
    await setDoc(doc(db, `users/${userId}/transactions`, t.id), t);
  };

  const deleteTransaction = async (id: string) => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `users/${userId}/transactions`, id));
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    if (!userId || !db) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newGoal = { ...g, id };
    await setDoc(doc(db, `users/${userId}/goals`, id), newGoal);
  };
  
  const updateGoal = async (id: string, g: Partial<Goal>) => {
    if (!userId || !db) return;
    await updateDoc(doc(db, `users/${userId}/goals`, id), g);
  };

  const deleteGoal = async (id: string) => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `users/${userId}/goals`, id));
  };

  const bulkDeleteGoals = async (ids: string[]) => {
    if (!userId || !db) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, `users/${userId}/goals`, id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  const addCategory = async (c: Omit<Category, 'id'>) => {
    if (!userId || !db) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newCategory = { ...c, id };
    await setDoc(doc(db, `users/${userId}/categories`, id), newCategory);
  };

  const updateCategory = async (id: string, c: Partial<Category>) => {
    if (!userId || !db) return;
    await updateDoc(doc(db, `users/${userId}/categories`, id), c);
  };

  const deleteCategory = async (id: string) => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `users/${userId}/categories`, id));
  };

  const bulkDeleteCategories = async (ids: string[]) => {
    if (!userId || !db) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, `users/${userId}/categories`, id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  const addTag = async (t: Omit<Tag, 'id'>) => {
    if (!userId || !db) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newTag = { ...t, id };
    await setDoc(doc(db, `users/${userId}/tags`, id), newTag);
  };

  const updateTag = async (id: string, t: Partial<Tag>) => {
    if (!userId || !db) return;
    await updateDoc(doc(db, `users/${userId}/tags`, id), t);
  };

  const deleteTag = async (id: string) => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `users/${userId}/tags`, id));
  };

  const bulkDeleteTags = async (ids: string[]) => {
    if (!userId || !db) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, `users/${userId}/tags`, id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  const updateMonthlyPlan = async (p: Partial<MonthlyPlan>) => {
    if (!userId || !db) return;
    const newPlan = { ...monthlyPlan, ...p };
    await updateUserData({ monthlyPlan: newPlan });
  };

  const updatePiggyBank = async (bank: string, balance: number, color?: string) => {
    if (!userId || !db) return;
    const newState = piggyBank.map(item => item.bank === bank ? { ...item, balance, color: color || item.color } : item);
    await updateUserData({ piggyBank: newState });
  };

  const bulkUpdatePiggyBank = async (updates: { bank: string; balance: number; color?: string }[]) => {
    if (!userId || !db) return;
    let newState = [...piggyBank];
    updates.forEach(update => {
      newState = newState.map(item => item.bank === update.bank ? { ...item, balance: update.balance, color: update.color || item.color } : item);
    });
    await updateUserData({ piggyBank: newState });
  };

  const resetPiggyBankBalance = async (bank: string) => {
    if (!userId || !db) return;
    const newState = piggyBank.map(item => item.bank === bank ? { ...item, balance: 0 } : item);
    await updateUserData({ piggyBank: newState });
  };

  const addPiggyBank = async (bank: string, color: string) => {
    if (!userId || !db) return;
    const newState = [...piggyBank, { bank, balance: 0, color }];
    await updateUserData({ piggyBank: newState });
  };

  const deletePiggyBank = async (bank: string) => {
    if (!userId || !db) return;
    const newState = piggyBank.filter(item => item.bank !== bank);
    await updateUserData({ piggyBank: newState });
  };

  const addPiggyBankTransaction = async (amount: number, date: string, bank: string, type: 'deposit' | 'withdrawal' | 'transfer', toBank?: string) => {
    if (!userId || !db) return;
    const newHistory = [...piggyBankHistory, { date, amount, bank, type, toBank }];
    await updateUserData({ piggyBankHistory: newHistory });
  };

  const updatePiggyBankDeposit = async (index: number, amount: number, date: string, bank: string, type?: 'deposit' | 'withdrawal' | 'transfer', toBank?: string) => {
    if (!userId || !db) return;
    const newHistory = piggyBankHistory.map((entry, i) => i === index ? { ...entry, amount, date, bank, type: type || entry.type, toBank: toBank || entry.toBank } : entry);
    await updateUserData({ piggyBankHistory: newHistory });
  };

  const deletePiggyBankDeposit = async (index: number) => {
    if (!userId || !db) return;
    const newHistory = piggyBankHistory.filter((_, i) => i !== index);
    await updateUserData({ piggyBankHistory: newHistory });
  };

  const updateUserSettings = async (s: Partial<UserSettings>) => {
    if (!userId || !db) return;
    setUserSettingsState(prev => {
      const newSettings = { ...prev, ...s };
      updateUserData({ userSettings: newSettings });
      return newSettings;
    });
  };

  const removeDuplicateTransactions = async () => {
    if (!userId || !db) return;
    const uniqueTransactions: Transaction[] = [];
    const seen = new Set<string>();
    const toDelete: string[] = [];
    
    transactions.forEach(t => {
      const key = `${t.description}-${t.categoryId}-${t.type}-${t.date}`;
      if (!seen.has(key)) {
        uniqueTransactions.push(t);
        seen.add(key);
      } else {
        toDelete.push(t.id);
      }
    });

    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach(id => {
        batch.delete(doc(db, `users/${userId}/transactions`, id));
      });
      await batch.commit();
    }
  };

  const findTransaction = (description: string, categoryId: string, type: string, date: string, groupId?: string) => {
    const targetDate = new Date(date);
    return transactions.find(t => {
      const sameMonth = isSameMonth(new Date(t.date), targetDate) && isSameYear(new Date(t.date), targetDate);
      if (!sameMonth) return false;
      
      if (groupId && t.groupId === groupId) return true;
      
      return t.description === description && 
             t.categoryId === categoryId && 
             t.type === type;
    });
  };

  // These are kept for compatibility but shouldn't be used directly to overwrite all data
  const setTransactions = (ts: Transaction[]) => {
    setTransactionsState(ts);
  };
  const setCategories = () => {};
  const setGoals = () => {};

  return (
    <AppContext.Provider value={{ 
      transactions,
      activeTransactions: transactions.filter(t => !t.ignored),
      categories, tags, goals, monthlyPlan, piggyBank, piggyBankHistory, userSettings,
      isTipsOpen, setIsTipsOpen, isDataLoaded,
      addTransaction, addGoal, updateGoal, deleteGoal, bulkDeleteGoals, addCategory,
      updateCategory, deleteCategory, bulkDeleteCategories, addTag, updateTag, deleteTag, bulkDeleteTags, updateTransaction, bulkUpdateTransactions, bulkDeleteTransactions, bulkUpsertTransactions, upsertTransaction, findTransaction, removeDuplicateTransactions, deleteTransaction,
      setTransactions, setCategories, setGoals, updateMonthlyPlan,
      updatePiggyBank, bulkUpdatePiggyBank, addPiggyBank, deletePiggyBank, resetPiggyBankBalance, addPiggyBankTransaction, updatePiggyBankDeposit, deletePiggyBankDeposit,
      updateUserSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
