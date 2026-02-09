import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction, INCOME_PAYMENT_METHODS } from '@/types/finance';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const { deleteTransaction, paymentMethods, clients } = useFinanceStore();

  const getPaymentMethodName = (transaction: Transaction) => {
    if (transaction.type === 'income' && transaction.incomePaymentMethod) {
      const method = INCOME_PAYMENT_METHODS.find(m => m.value === transaction.incomePaymentMethod);
      return method?.label || transaction.incomePaymentMethod;
    }
    if (transaction.paymentMethodId) {
      return paymentMethods.find(pm => pm.id === transaction.paymentMethodId)?.name || 'Desconocido';
    }
    return 'Sin método';
  };

  const getClientName = (id?: string) => {
    if (!id) return null;
    return clients.find(c => c.id === id)?.name;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (transactions.length === 0) {
    return (
      <Card className="bg-card border-border shadow-custom p-12 text-center">
        <p className="text-muted-foreground text-lg">No hay transacciones aún</p>
        <p className="text-muted-foreground text-sm mt-2">Agrega tu primera transacción para comenzar</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTransactions.map((transaction) => {
        const clientName = getClientName(transaction.clientId);
        
        return (
          <Card
            key={transaction.id}
            className="bg-card border-border shadow-custom p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    transaction.type === 'income'
                      ? 'bg-primary/10'
                      : 'bg-destructive/10'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="w-6 h-6 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-destructive" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">
                      {transaction.category}
                    </h4>
                    {clientName && (
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 rounded-lg"
                      >
                        {clientName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}</span>
                    <span>•</span>
                    <span>{getPaymentMethodName(transaction)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      transaction.type === 'income'
                        ? 'text-primary'
                        : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}$
                    {transaction.amount.toLocaleString()}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTransaction(transaction.id)}
                  className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
