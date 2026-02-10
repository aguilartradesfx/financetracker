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
  isSyncing: boolean;
  lastSyncLog: string[];
  
  initialize: () => Promise<void>;
  refetchAll: () => Promise<void>;
  backfillIncomes: () => Promise<void>;
  
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
      return { startDate: last7, endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
    case 'currentMonth': {
      const monthDate = customDate || now;
      return {
        startDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        endDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    case 'last3months': {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
      return {
        startDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    case 'last12months': {
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      return {
        startDate: new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    case 'allTime':
      return {
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2099, 11, 31, 23, 59, 59, 999)
      };
    default:
      return getDateRange('currentMonth');
  }
};

// ===== DB row converters =====
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

const dbToClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  company: row.company || '',
  totalInvoice: parseFloat(row.total_invoice) || 0,
  totalPaid: parseFloat(row.total_paid) || 0,
  myCost: parseFloat(row.my_cost) || 0,
  totalCharged: parseFloat(row.total_charged) || 0,
  paymentMethod: row.payment_method || 'stripe',
  lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : undefined,
});

const dbToPaymentMethod = (row: any): PaymentMethod => ({
  id: row.id,
  name: row.name,
  type: row.type,
});

const getCurrentMonthFilter = (): DateFilter => ({
  type: 'currentMonth',
  ...getDateRange('currentMonth'),
  customMonth: new Date(),
});

// ===== DIRECT DB FETCHERS =====
const fetchAllTransactions = async (): Promise<Transaction[]> => {
  if (!supabaseConnected) return [];
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  if (error) { console.error('[fetchAllTransactions]', error); return []; }
  return (data || []).map(dbToTransaction);
};

const fetchAllClients = async (): Promise<Client[]> => {
  if (!supabaseConnected) return [];
  const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
  if (error) { console.error('[fetchAllClients]', error); return []; }
  return (data || []).map(dbToClient);
};

const fetchAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
  if (!supabaseConnected) return [];
  const { data, error } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });
  if (error) { console.error('[fetchAllPaymentMethods]', error); return []; }
  return (data || []).map(dbToPaymentMethod);
};

// ================================================================
export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  paymentMethods: [],
  clients: [],
  dateFilter: getCurrentMonthFilter(),
  isLoading: false,
  isInitialized: false,
  isSyncing: false,
  lastSyncLog: [],

  // ===== REFETCH ALL =====
  refetchAll: async () => {
    if (!supabaseConnected) return;
    try {
      const [transactions, clients, paymentMethods] = await Promise.all([
        fetchAllTransactions(), fetchAllClients(), fetchAllPaymentMethods(),
      ]);
      set({ transactions, clients, paymentMethods });
      console.log('[refetchAll] tx:', transactions.length, 'clients:', clients.length, 'pm:', paymentMethods.length);
    } catch (e) {
      console.error('[refetchAll]', e);
    }
  },

  // ===== BACKFILL INCOMES FROM CLIENTS =====
  backfillIncomes: async () => {
    if (!supabaseConnected) return;
    set({ isSyncing: true, lastSyncLog: [] });
    const logs: string[] = [];

    try {
      const [clients, transactions] = await Promise.all([fetchAllClients(), fetchAllTransactions()]);
      logs.push(`Clientes: ${clients.length}, Transacciones existentes: ${transactions.length}`);

      const clientsWithCharge = clients.filter(c => c.totalCharged > 0);
      logs.push(`Clientes con cobros > 0: ${clientsWithCharge.length}`);

      let totalBackfilled = 0;
      for (const client of clientsWithCharge) {
        const existingSum = transactions
          .filter(t => t.clientId === client.id && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const missing = client.totalCharged - existingSum;
        logs.push(`[${client.name}] charged=${client.totalCharged}, existing=${existingSum}, missing=${missing}`);

        if (missing > 0.01) {
          const backfillDate = client.lastPaymentDate || new Date();
          const { data, error } = await supabase.from('transactions').insert({
            date: backfillDate.toISOString(),
            type: 'income',
            amount: missing,
            category: 'client_payment',
            description: `Backfill: Pago cliente ${client.name}${client.company ? ' (' + client.company + ')' : ''}`,
            income_payment_method: client.paymentMethod || 'stripe',
            payment_method_id: null,
            client_id: client.id,
          }).select().single();

          if (error) {
            logs.push(`  ❌ Error: ${error.message}`);
          } else {
            logs.push(`  ✅ Backfilled $${missing} (tx: ${data?.id})`);
            totalBackfilled++;
          }
        } else {
          logs.push(`  ⏭️ No backfill needed`);
        }
      }

      logs.push(`--- Done. ${totalBackfilled} transactions created. ---`);
      console.log('[backfill]', logs);

      // Refetch everything
      const [freshTx, freshClients, freshPm] = await Promise.all([
        fetchAllTransactions(), fetchAllClients(), fetchAllPaymentMethods(),
      ]);
      set({ transactions: freshTx, clients: freshClients, paymentMethods: freshPm, isSyncing: false, lastSyncLog: logs });
    } catch (e) {
      logs.push(`❌ Failed: ${String(e)}`);
      set({ isSyncing: false, lastSyncLog: logs });
    }
  },

  // ===== INITIALIZE =====
  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    if (!supabaseConnected) {
      console.warn('Supabase not connected.');
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      const [transactions, paymentMethods, clients] = await Promise.all([
        fetchAllTransactions(), fetchAllPaymentMethods(), fetchAllClients(),
      ]);
      console.log('[init] tx:', transactions.length, 'clients:', clients.length, 'pm:', paymentMethods.length);

      set({ transactions, paymentMethods, clients, dateFilter: getCurrentMonthFilter(), isLoading: false, isInitialized: true });

      // Auto-backfill check
      const clientsWithCharge = clients.filter(c => c.totalCharged > 0);
      if (clientsWithCharge.length > 0) {
        let needsBackfill = false;
        for (const client of clientsWithCharge) {
          const clientSum = transactions.filter(t => t.clientId === client.id && t.type === 'income').reduce((s, t) => s + t.amount, 0);
          if (client.totalCharged - clientSum > 0.01) { needsBackfill = true; break; }
        }
        if (needsBackfill) {
          console.log('[init] Missing income transactions detected, auto-backfilling...');
          setTimeout(() => get().backfillIncomes(), 500);
        }
      }

      // Realtime as bonus
      try {
        supabase.channel('finance-v2')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => get().refetchAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => get().refetchAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => get().refetchAll())
          .subscribe((status) => console.log('[realtime]', status));
      } catch (e) {
        console.warn('[init] Realtime failed:', e);
      }
    } catch (error) {
      console.error('Init failed:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  // ===== TRANSACTIONS CRUD =====
  addTransaction: async (transaction) => {
    if (!supabaseConnected) {
      const newTx: Transaction = { ...transaction, id: crypto.randomUUID() } as Transaction;
      set((s) => ({ transactions: [newTx, ...s.transactions] }));
      return;
    }
    const { error } = await supabase.from('transactions').insert({
      date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
      type: transaction.type, amount: transaction.amount, category: transaction.category,
      description: transaction.description, payment_method_id: transaction.paymentMethodId || null,
      income_payment_method: transaction.incomePaymentMethod || null, client_id: transaction.clientId || null,
    });
    if (error) { console.error('[addTransaction]', error); return; }
    const fresh = await fetchAllTransactions();
    set({ transactions: fresh });
    console.log('[addTransaction] Done. Total tx:', fresh.length);
  },

  updateTransaction: async (id, updates) => {
    if (!supabaseConnected) {
      set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t) }));
      return;
    }
    const dbUp: any = {};
    if (updates.date !== undefined) dbUp.date = updates.date instanceof Date ? updates.date.toISOString() : updates.date;
    if (updates.type !== undefined) dbUp.type = updates.type;
    if (updates.amount !== undefined) dbUp.amount = updates.amount;
    if (updates.category !== undefined) dbUp.category = updates.category;
    if (updates.description !== undefined) dbUp.description = updates.description;
    if (updates.paymentMethodId !== undefined) dbUp.payment_method_id = updates.paymentMethodId || null;
    if (updates.incomePaymentMethod !== undefined) dbUp.income_payment_method = updates.incomePaymentMethod || null;
    if (updates.clientId !== undefined) dbUp.client_id = updates.clientId || null;
    const { error } = await supabase.from('transactions').update(dbUp).eq('id', id);
    if (error) { console.error('[updateTransaction]', error); return; }
    const fresh = await fetchAllTransactions();
    set({ transactions: fresh });
  },

  deleteTransaction: async (id) => {
    if (!supabaseConnected) {
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
      return;
    }
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error('[deleteTransaction]', error); return; }
    const fresh = await fetchAllTransactions();
    set({ transactions: fresh });
  },

  // ===== PAYMENT METHODS CRUD =====
  addPaymentMethod: async (method) => {
    if (!supabaseConnected) {
      set((s) => ({ paymentMethods: [...s.paymentMethods, { ...method, id: crypto.randomUUID() }] }));
      return;
    }
    const { error } = await supabase.from('payment_methods').insert({ name: method.name, type: method.type });
    if (error) { console.error('[addPaymentMethod]', error); return; }
    const fresh = await fetchAllPaymentMethods();
    set({ paymentMethods: fresh });
  },

  updatePaymentMethod: async (id, updates) => {
    if (!supabaseConnected) {
      set((s) => ({ paymentMethods: s.paymentMethods.map((m) => m.id === id ? { ...m, ...updates } : m) }));
      return;
    }
    const { error } = await supabase.from('payment_methods').update(updates).eq('id', id);
    if (error) { console.error('[updatePaymentMethod]', error); return; }
    const fresh = await fetchAllPaymentMethods();
    set({ paymentMethods: fresh });
  },

  deletePaymentMethod: async (id) => {
    if (!supabaseConnected) {
      set((s) => ({ paymentMethods: s.paymentMethods.filter((m) => m.id !== id) }));
      return;
    }
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) { console.error('[deletePaymentMethod]', error); return; }
    const fresh = await fetchAllPaymentMethods();
    set({ paymentMethods: fresh });
  },

  // ===== CLIENT CRUD WITH INCOME SYNC =====
  addClient: async (client) => {
    if (!supabaseConnected) {
      const nc: Client = { ...client, id: crypto.randomUUID() };
      set((s) => ({ clients: [...s.clients, nc] }));
      return;
    }

    const paymentDate = client.lastPaymentDate || new Date();

    const { data: inserted, error } = await supabase.from('clients').insert({
      name: client.name, company: client.company, total_invoice: client.totalInvoice,
      total_paid: client.totalPaid, my_cost: client.myCost, total_charged: client.totalCharged,
      payment_method: client.paymentMethod || 'stripe',
      last_payment_date: paymentDate.toISOString(),
    }).select().single();

    if (error) { console.error('[addClient]', error); return; }
    console.log('[addClient] Inserted:', inserted.id, 'totalCharged:', client.totalCharged);

    // Create income transaction if totalCharged > 0
    if ((client.totalCharged ?? 0) > 0) {
      const { data: txD, error: txE } = await supabase.from('transactions').insert({
        date: paymentDate.toISOString(), type: 'income', amount: client.totalCharged,
        category: 'client_payment',
        description: `Cobro de cliente: ${client.name}${client.company ? ' (' + client.company + ')' : ''}`,
        income_payment_method: client.paymentMethod || 'stripe',
        payment_method_id: null, client_id: inserted.id,
      }).select().single();
      if (txE) console.error('[addClient] tx error:', txE);
      else console.log('[addClient] Income tx:', txD?.id, '$' + txD?.amount);
    }

    // Deterministic refetch
    const [freshTx, freshCl] = await Promise.all([fetchAllTransactions(), fetchAllClients()]);
    set({ transactions: freshTx, clients: freshCl });
  },

  updateClient: async (id, updates) => {
    if (!supabaseConnected) {
      set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...updates } : c) }));
      return;
    }

    // Step 1: Fresh client from DB
    const { data: fresh, error: fetchE } = await supabase.from('clients').select('*').eq('id', id).single();
    if (fetchE || !fresh) { console.error('[updateClient] fetch error:', fetchE); return; }

    const prevCharged = parseFloat(fresh.total_charged) || 0;

    // Step 2: Update
    const dbUp: any = {};
    if (updates.name !== undefined) dbUp.name = updates.name;
    if (updates.company !== undefined) dbUp.company = updates.company;
    if (updates.totalInvoice !== undefined) dbUp.total_invoice = updates.totalInvoice;
    if (updates.totalPaid !== undefined) dbUp.total_paid = updates.totalPaid;
    if (updates.myCost !== undefined) dbUp.my_cost = updates.myCost;
    if (updates.totalCharged !== undefined) dbUp.total_charged = updates.totalCharged;
    if (updates.paymentMethod !== undefined) dbUp.payment_method = updates.paymentMethod;
    if (updates.lastPaymentDate !== undefined) dbUp.last_payment_date = updates.lastPaymentDate.toISOString();

    const { error: upE } = await supabase.from('clients').update(dbUp).eq('id', id);
    if (upE) { console.error('[updateClient]', upE); return; }

    // Step 3: Delta income
    const nextCharged = updates.totalCharged ?? prevCharged;
    const delta = nextCharged - prevCharged;
    console.log('[updateClient] id:', id, 'prev:', prevCharged, 'next:', nextCharged, 'delta:', delta);

    if (updates.totalCharged !== undefined && delta > 0.01) {
      const paymentDate = updates.lastPaymentDate || new Date();
      const { data: txD, error: txE } = await supabase.from('transactions').insert({
        date: paymentDate.toISOString(), type: 'income', amount: delta,
        category: 'client_payment',
        description: `Cobro de cliente: ${updates.name || fresh.name}${(updates.company ?? fresh.company) ? ' (' + (updates.company ?? fresh.company) + ')' : ''}`,
        income_payment_method: updates.paymentMethod || fresh.payment_method || 'stripe',
        payment_method_id: null, client_id: id,
      }).select().single();
      if (txE) console.error('[updateClient] tx error:', txE);
      else console.log('[updateClient] Delta tx:', txD?.id, '$' + delta);
    }

    // Step 4: Deterministic refetch
    const [freshTx, freshCl] = await Promise.all([fetchAllTransactions(), fetchAllClients()]);
    set({ transactions: freshTx, clients: freshCl });
  },

  deleteClient: async (id) => {
    if (!supabaseConnected) {
      set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
      return;
    }
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { console.error('[deleteClient]', error); return; }
    const [freshTx, freshCl] = await Promise.all([fetchAllTransactions(), fetchAllClients()]);
    set({ transactions: freshTx, clients: freshCl });
  },

  // ===== DATE FILTERS =====
  setDateFilter: (type, customDate) =>
    set(() => {
      const range = getDateRange(type, customDate);
      return {
        dateFilter: {
          type, startDate: range.startDate, endDate: range.endDate,
          customMonth: type === 'currentMonth' ? (customDate || new Date()) : undefined,
        },
      };
    }),

  navigateMonth: (direction) =>
    set((state) => {
      const cur = state.dateFilter.customMonth || new Date();
      const nw = new Date(cur);
      if (direction === 'next') nw.setMonth(nw.getMonth() + 1);
      else nw.setMonth(nw.getMonth() - 1);
      const range = getDateRange('currentMonth', nw);
      return { dateFilter: { type: 'currentMonth', startDate: range.startDate, endDate: range.endDate, customMonth: nw } };
    }),

  getFilteredTransactions: () => {
    const state = get();
    const { startDate, endDate, type } = state.dateFilter;
    if (type === 'allTime') return state.transactions;
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    return state.transactions.filter((t) => {
      const ms = new Date(t.date).getTime();
      return ms >= startMs && ms <= endMs;
    });
  },
}));
