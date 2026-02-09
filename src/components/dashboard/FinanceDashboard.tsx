import { Users, TrendingUp, TrendingDown, LayoutDashboard, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceStore } from '@/store/financeStore';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ClientManagement } from '@/components/clients/ClientManagement';
import { PaymentMethodsManager } from '@/components/payments/PaymentMethodsManager';
import { DateFilterBar } from '@/components/common/DateFilterBar';

export function FinanceDashboard() {
  const { getFilteredTransactions } = useFinanceStore();
  const filteredTransactions = getFilteredTransactions();

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-custom sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Panel Financiero</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona tus ingresos, gastos y clientes
              </p>
            </div>
            <TransactionForm />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Date Filter */}
          <DateFilterBar />

          {/* Navigation Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-card border border-border rounded-2xl p-1 shadow-custom">
              <TabsTrigger
                value="dashboard"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="clients"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Gastos
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Métodos de Pago
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Dashboard */}
              <TabsContent value="dashboard" className="mt-0">
                <DashboardMetrics transactions={filteredTransactions} />
              </TabsContent>

              {/* Clientes */}
              <TabsContent value="clients" className="mt-0">
                <ClientManagement />
              </TabsContent>

              {/* Ingresos */}
              <TabsContent value="income" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Ingresos</h2>
                    <TransactionForm defaultType="income" />
                  </div>
                  <TransactionList transactions={incomeTransactions} />
                </div>
              </TabsContent>

              {/* Gastos */}
              <TabsContent value="expenses" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Gastos</h2>
                    <TransactionForm defaultType="expense" />
                  </div>
                  <TransactionList transactions={expenseTransactions} />
                </div>
              </TabsContent>

              {/* Métodos de Pago */}
              <TabsContent value="payments" className="mt-0">
                <PaymentMethodsManager />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
