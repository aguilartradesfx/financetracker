import { create } from 'zustand';
import { Transaction, PaymentMethod, Client, IncomePaymentMethod } from '@/types/finance';
import { supabase, supabaseConnected } from '@/lib/supabase';

export type DateRangeType = 'today' | 'last7days' | 'currentMonth' | 'last3months' | 'last12months' | 'allTime' | 'custom';

export interface DateFilter {
  type: DateRangeType;
  startDate: Date;
  endDate: Date;
  customMonth?: Date;
}

interface FinanceStore {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  clients: Client[];
  dateFilter: DateFilter;
  isLoading: boolean;
  isInitialized: boolean;
  
  initialize: () => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  setDateFilter: (type: DateRangeType, customDate?: Date) => void;
  navigateMonth: (direction: 'next' | 'prev') => void;
  getFilteredTransactions: () => Transaction[];
}

const getDateRange = (type: DateRangeType, customDate?: Date): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (type) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'last7days': {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      return {
        startDate: last7,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'currentMonth': {
      const monthDate = customDate || now;
      return {
        startDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        endDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      };
    }
    
    case 'last3months': {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
      return {
        startDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      };
    }
    
    case 'last12months': {
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      return {
        startDate: new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      };
    }
    
    case 'allTime':
      return {
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2099, 11, 31)
      };
    
    default:
      return getDateRange('currentMonth');
  }
};

// Helper: Convert DB row to Transaction
const dbToTransaction = (row: any): Transaction => ({
  id: row.id,
  date: new Date(row.date),
  type: row.type,
  amount: parseFloat(row.amount),
  category: row.category || '',
  description: row.description || '',
  paymentMethodId: row.payment_method_id || undefined,
  incomePaymentMethod: row.income_payment_method as IncomePaymentMethod | undefined,
  clientId: row.client_id || undefined,
});

// Helper: Convert DB row to Client
const dbToClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  company: row.company || '',
  totalInvoice: parseFloat(row.total_invoice) || 0,
  totalPaid: parseFloat(row.total_paid) || 0,
  myCost: parseFloat(row.my_cost) || 0,
  totalCharged: parseFloat(row.total_charged) || 0,
});

// Helper: Convert DB row to PaymentMethod
const dbToPaymentMethod = (row: any): PaymentMethod => ({
  id: row.id,
  name: row.name,
  type: row.type,
});

// Default date filter is always the current month (auto-updates)
const getCurrentMonthFilter = (): DateFilter => ({
  type: 'currentMonth',
  ...getDateRange('currentMonth'),
  customMonth: new Date(),
});

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  paymentMethods: [],
  clients: [],
  dateFilter: getCurrentMonthFilter(),
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    if (!supabaseConnected) {
      console.warn('Supabase not connected. Running with empty local state. Connect Supabase and add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env variables.');
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      // Fetch all data from Supabase
      const [transRes, pmRes, clientRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('payment_methods').select('*').order('created_at', { ascending: true }),
        supabase.from('clients').select('*').order('name', { ascending: true }),
      ]);

      const transactions = (transRes.data || []).map(dbToTransaction);
      const paymentMethods = (pmRes.data || []).map(dbToPaymentMethod);
      const clients = (clientRes.data || []).map(dbToClient);

      // Always default to current month
      set({
        transactions,
        paymentMethods,
        clients,
        dateFilter: getCurrentMonthFilter(),
        isLoading: false,
        isInitialized: true,
      });

      // Set up realtime subscriptions
      supabase
        .channel('finance-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
          const state = get();
          if (payload.eventType === 'INSERT') {
            const newTx = dbToTransaction(payload.new);
            set({ transactions: [newTx, ...state.transactions] });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbToTransaction(payload.new);
            set({ transactions: state.transactions.map(t => t.id === updated.id ? updated : t) });
          } else if (payload.eventType === 'DELETE') {
            set({ transactions: state.transactions.filter(t => t.id !== (payload.old as any).id) });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, (payload) => {
          const state = get();
          if (payload.eventType === 'INSERT') {
            set({ paymentMethods: [...state.paymentMethods, dbToPaymentMethod(payload.new)] });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbToPaymentMethod(payload.new);
            set({ paymentMethods: state.paymentMethods.map(m => m.id === updated.id ? updated : m) });
          } else if (payload.eventType === 'DELETE') {
            set({ paymentMethods: state.paymentMethods.filter(m => m.id !== (payload.old as any).id) });
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload) => {
          const state = get();
          const updated = dbToClient(payload.new);
          set({ clients: state.clients.map(c => c.id === updated.id ? updated : c) });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (payload) => {
          const state = get();
          set({ clients: state.clients.filter(c => c.id !== (payload.old as any).id) });
        })
        .subscribe();

    } catch (error) {
      console.error('Failed to initialize finance store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },
  
  addTransaction: async (transaction) => {
    if (!supabaseConnected) {
      // Local-only fallback
      const newTx: Transaction = { ...transaction, id: crypto.randomUUID() } as Transaction;
      set((state) => ({ transactions: [newTx, ...state.transactions] }));
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        payment_method_id: transaction.paymentMethodId || null,
        income_payment_method: transaction.incomePaymentMethod || null,
        client_id: transaction.clientId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      return;
    }

    if (data) {
      const newTx = dbToTransaction(data);
      set((state) => ({ transactions: [newTx, ...state.transactions] }));
    }
  },
  
  updateTransaction: async (id, updates) => {
    if (!supabaseConnected) {
      set((state) => ({
        transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
      }));
      return;
    }

    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date instanceof Date ? updates.date.toISOString() : updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.paymentMethodId !== undefined) dbUpdates.payment_method_id = updates.paymentMethodId || null;
    if (updates.incomePaymentMethod !== undefined) dbUpdates.income_payment_method = updates.incomePaymentMethod || null;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId || null;

    const { error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating transaction:', error);
      return;
    }

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },
  
  deleteTransaction: async (id) => {
    if (!supabaseConnected) {
      set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return;
    }

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },
  
  addPaymentMethod: async (method) => {
    if (!supabaseConnected) {
      const newMethod: PaymentMethod = { ...method, id: crypto.randomUUID() };
      set((state) => ({ paymentMethods: [...state.paymentMethods, newMethod] }));
      return;
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        name: method.name,
        type: method.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding payment method:', error);
      return;
    }

    if (data) {
      set((state) => ({ paymentMethods: [...state.paymentMethods, dbToPaymentMethod(data)] }));
    }
  },
  
  updatePaymentMethod: async (id, updates) => {
    if (!supabaseConnected) {
      set((state) => ({
        paymentMethods: state.paymentMethods.map((m) => m.id === id ? { ...m, ...updates } : m),
      }));
      return;
    }

    const { error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating payment method:', error);
      return;
    }

    set((state) => ({
      paymentMethods: state.paymentMethods.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },
  
  deletePaymentMethod: async (id) => {
    if (!supabaseConnected) {
      set((state) => ({ paymentMethods: state.paymentMethods.filter((m) => m.id !== id) }));
      return;
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment method:', error);
      return;
    }

    set((state) => ({
      paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
    }));
  },
  
  addClient: async (client) => {
    if (!supabaseConnected) {
      const newClient: Client = { ...client, id: crypto.randomUUID() };
      set((state) => ({ clients: [...state.clients, newClient] }));
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        company: client.company,
        total_invoice: client.totalInvoice,
        total_paid: client.totalPaid,
        my_cost: client.myCost,
        total_charged: client.totalCharged,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding client:', error);
      return;
    }

    if (data) {
      set((state) => ({ clients: [...state.clients, dbToClient(data)] }));
    }
  },
  
  updateClient: async (id, updates) => {
    if (!supabaseConnected) {
      set((state) => ({
        clients: state.clients.map((c) => c.id === id ? { ...c, ...updates } : c),
      }));
      return;
    }

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.totalInvoice !== undefined) dbUpdates.total_invoice = updates.totalInvoice;
    if (updates.totalPaid !== undefined) dbUpdates.total_paid = updates.totalPaid;
    if (updates.myCost !== undefined) dbUpdates.my_cost = updates.myCost;
    if (updates.totalCharged !== undefined) dbUpdates.total_charged = updates.totalCharged;

    const { error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating client:', error);
      return;
    }

    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },
  
  deleteClient: async (id) => {
    if (!supabaseConnected) {
      set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
      return;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return;
    }

    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));
  },
  
  setDateFilter: (type, customDate) =>
    set(() => {
      const range = getDateRange(type, customDate);
      return {
        dateFilter: {
          type,
          startDate: range.startDate,
          endDate: range.endDate,
          customMonth: type === 'currentMonth' ? (customDate || new Date()) : undefined,
        },
      };
    }),
  
  navigateMonth: (direction) =>
    set((state) => {
      const currentMonth = state.dateFilter.customMonth || new Date();
      const newMonth = new Date(currentMonth);
      
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      
      const range = getDateRange('currentMonth', newMonth);
      return {
        dateFilter: {
          type: 'currentMonth',
          startDate: range.startDate,
          endDate: range.endDate,
          customMonth: newMonth,
        },
      };
    }),
  
  getFilteredTransactions: () => {
    const state = get();
    const { startDate, endDate } = state.dateFilter;
    
    return state.transactions.filter((t) => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    });
  },
}));
