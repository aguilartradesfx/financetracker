import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/types/finance';

interface DashboardMetricsProps {
  transactions: Transaction[];
}

export function DashboardMetrics({ transactions }: DashboardMetricsProps) {
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    return {
      income,
      expense,
      balance,
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card border-border shadow-custom p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">Ingresos</span>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-foreground">
            ${stats.income.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Período seleccionado</span>
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
          <span className="text-3xl font-bold text-foreground">
            ${stats.expense.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Período seleccionado</span>
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
            ${stats.balance.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Período seleccionado</span>
        </div>
      </Card>
    </div>
  );
}
