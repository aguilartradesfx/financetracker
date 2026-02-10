import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/types/finance';
import { useFinanceStore } from '@/store/financeStore';

interface DashboardMetricsProps {
  transactions: Transaction[];
}

export function DashboardMetrics({ transactions }: DashboardMetricsProps) {
  const { transactions: allTransactions, clients } = useFinanceStore();

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;

    // Calculate total "Restante" from clients
    const totalRemaining = clients.reduce((sum, client) => {
      return sum + (client.totalInvoice - client.totalPaid);
    }, 0);

    return { income, expense, balance, incomeCount, expenseCount, totalRemaining };
  }, [transactions, clients]);

  return (
    <div className="space-y-4">
      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-custom p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Ingresos</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-primary">
              ${stats.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">{stats.incomeCount} transacciones</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-custom p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Gastos</span>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-destructive">
              ${stats.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">{stats.expenseCount} transacciones</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-custom p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Balance</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stats.balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <DollarSign className={`w-5 h-5 ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="mb-2">
            <span className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Ingreso - Gasto</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-custom p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Restante</span>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-yellow-500">
              ${stats.totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Pendiente de cobro</span>
          </div>
        </Card>
      </div>

      {/* Transaction counter */}
      <Card className="bg-card border-border shadow-custom p-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-medium">
              {transactions.length} de {allTransactions.length} transacciones
            </span>
            <span className="text-muted-foreground">en el período seleccionado</span>
          </div>
          {allTransactions.length > 0 && transactions.length === 0 && (
            <span className="text-yellow-500 text-xs ml-auto">
              ⚠️ Hay transacciones pero ninguna coincide con el filtro actual
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
