export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  description: string;
  categoryId: string;
  accountId?: string;
  status: TransactionStatus;
  isFixed?: boolean;
  groupId?: string;
  sortOrder?: number;
  tags?: string[];
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'wallet' | 'investment';
  balance: number;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  brand: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
  deposits?: { amount: number; date: string }[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CategoryBudget {
  categoryId: string;
  limit: number;
}

export interface MonthlyPlan {
  income: number;
  savingsPercentage: number;
  budgets: CategoryBudget[];
}
