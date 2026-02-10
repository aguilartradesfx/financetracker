import { Users, TrendingUp, TrendingDown, LayoutDashboard, CreditCard, RefreshCw, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceStore } from '@/store/financeStore';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ClientManagement } from '@/components/clients/ClientManagement';
import { PaymentMethodsManager } from '@/components/payments/PaymentMethodsManager';
import { DateFilterBar } from '@/components/common/DateFilterBar';
import { TransactionCalendar } from '@/components/calendar/TransactionCalendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { INCOME_PAYMENT_METHODS } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function FinanceDashboard() {
  const { getFilteredTransactions, refetchAll, backfillIncomes, transactions, clients, isSyncing, lastSyncLog } = useFinanceStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSyncLog, setShowSyncLog] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const filteredTransactions = getFilteredTransactions();

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchAll();
    setIsRefreshing(false);
  };

  const handleRepairSync = async () => {
    await backfillIncomes();
    setShowSyncLog(true);
  };

  // Debug: distinct types in ALL transactions
  const distinctTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.type));
    return Array.from(types);
  }, [transactions]);

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairSync}
                disabled={isSyncing}
                className="bg-[#1a1520] border-zinc-700 hover:bg-zinc-800 text-yellow-500 hover:text-yellow-400"
                title="Reparar/Sincronizar ingresos desde clientes"
              >
                <Wrench className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Reparar / Sync'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#1a1520] border-zinc-700 hover:bg-zinc-800"
                title="Refrescar datos"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <TransactionForm />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Sync Log */}
          {lastSyncLog.length > 0 && showSyncLog && (
            <Card className="bg-[#1a1520] border-yellow-500/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-yellow-500">📋 Sync Log</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSyncLog(false)}
                  className="text-zinc-400 hover:text-white h-6 px-2"
                >
                  Cerrar
                </Button>
              </div>
              <div className="bg-black/40 rounded-lg p-3 max-h-48 overflow-y-auto">
                {lastSyncLog.map((log, i) => (
                  <p key={i} className="text-xs text-zinc-300 font-mono leading-5">{log}</p>
                ))}
              </div>
            </Card>
          )}

          {/* Date Filter */}
          <div className="flex items-center justify-between">
            <DateFilterBar />
          </div>

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
                {incomeTransactions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                    {incomeTransactions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Gastos
                {expenseTransactions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                    {expenseTransactions.length}
                  </Badge>
                )}
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
                <div className="space-y-6">
                  <DashboardMetrics transactions={filteredTransactions} />
                  <div className="mt-8">
                    <TransactionCalendar />
                  </div>
                </div>
              </TabsContent>

              {/* Clientes */}
              <TabsContent value="clients" className="mt-0">
                <ClientManagement />
              </TabsContent>

              {/* === INGRESOS V2 === */}
              <TabsContent value="income" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Ingresos</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incomeTransactions.length} ingresos en período · ${incomeTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} total
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        {showDebug ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        Debug
                      </Button>
                      <TransactionForm defaultType="income" />
                    </div>
                  </div>

                  {/* Debug Panel */}
                  {showDebug && (
                    <Card className="bg-[#1a1520] border-zinc-700 p-4">
                      <h4 className="text-xs font-bold text-zinc-400 mb-2">🔍 DEBUG INFO</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-500">Total transacciones (DB):</span>
                          <span className="text-foreground ml-1 font-mono">{transactions.length}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Filtradas (período):</span>
                          <span className="text-foreground ml-1 font-mono">{filteredTransactions.length}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Tipos distintos:</span>
                          <span className="text-foreground ml-1 font-mono">{distinctTypes.join(', ') || 'ninguno'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Clientes:</span>
                          <span className="text-foreground ml-1 font-mono">{clients.length}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Income en DB total:</span>
                          <span className="text-foreground ml-1 font-mono">
                            {transactions.filter(t => t.type === 'income').length} (${transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()})
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Expense en DB total:</span>
                          <span className="text-foreground ml-1 font-mono">
                            {transactions.filter(t => t.type === 'expense').length} (${transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()})
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Sum clients.totalCharged:</span>
                          <span className="text-foreground ml-1 font-mono">
                            ${clients.reduce((s, c) => s + c.totalCharged, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Income list with extra details */}
                  {incomeTransactions.length === 0 ? (
                    <Card className="bg-card border-border shadow-custom p-12 text-center">
                      <p className="text-muted-foreground text-lg">No hay ingresos en este período</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {transactions.filter(t => t.type === 'income').length > 0
                          ? `Hay ${transactions.filter(t => t.type === 'income').length} ingresos en total — prueba "Desde el inicio" en el filtro`
                          : 'Agrega un ingreso o crea un cliente con cobro para generar uno automáticamente'
                        }
                      </p>
                      {clients.length > 0 && clients.some(c => c.totalCharged > 0) && transactions.filter(t => t.type === 'income').length === 0 && (
                        <Button
                          onClick={handleRepairSync}
                          disabled={isSyncing}
                          className="mt-4 bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          {isSyncing ? 'Sincronizando...' : 'Generar ingresos desde clientes'}
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {[...incomeTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => {
                        const client = clients.find(c => c.id === tx.clientId);
                        const pmLabel = INCOME_PAYMENT_METHODS.find(m => m.value === tx.incomePaymentMethod)?.label || tx.incomePaymentMethod || 'N/A';
                        
                        return (
                          <Card
                            key={tx.id}
                            className="bg-card border-border shadow-custom p-5 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <TrendingUp className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {tx.category || 'Ingreso'}
                                    </h4>
                                    {client && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-lg text-xs">
                                        {client.name}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 rounded-lg text-xs">
                                      {pmLabel}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                                    {tx.description}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-2xl font-bold text-primary">
                                  +${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Gastos */}
              <TabsContent value="expenses" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Gastos</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {expenseTransactions.length} gastos en período · ${expenseTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} total
                      </p>
                    </div>
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
