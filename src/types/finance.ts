export type TransactionType = 'income' | 'expense';

export type IncomePaymentMethod = 'stripe' | 'transferencia' | 'efectivo';

export const INCOME_PAYMENT_METHODS: { value: IncomePaymentMethod; label: string }[] = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
];

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'efectivo' | 'tarjeta' | 'banco' | 'digital';
}

export interface Client {
  id: string;
  name: string;
  company: string;
  totalInvoice: number;       // Factura total
  totalPaid: number;          // Lo que han pagado
  myCost: number;             // Mi costo
  totalCharged: number;       // Lo que he cobrado
}

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  paymentMethodId?: string;           // For expenses (user's own payment methods)
  incomePaymentMethod?: IncomePaymentMethod; // For income (how client pays: Stripe, Transferencia, Efectivo)
  clientId?: string;
}

export interface MonthlyStats {
  monthlyIncome: number;
  monthlyExpense: number;
  yearlyIncome: number;
}
