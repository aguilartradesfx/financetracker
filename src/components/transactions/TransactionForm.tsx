import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFinanceStore } from '@/store/financeStore';
import { TransactionType, IncomePaymentMethod, INCOME_PAYMENT_METHODS } from '@/types/finance';

interface TransactionFormProps {
  trigger?: React.ReactNode;
  defaultType?: TransactionType;
}

export function TransactionForm({ trigger, defaultType }: TransactionFormProps) {
  const { addTransaction, paymentMethods, clients } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: (defaultType || 'income') as TransactionType,
    amount: '',
    category: '',
    description: '',
    paymentMethodId: '',
    incomePaymentMethod: '' as string,
    clientId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isIncome = formData.type === 'income';

    addTransaction({
      date: new Date(formData.date),
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      // For income: use incomePaymentMethod. For expense: use paymentMethodId
      paymentMethodId: !isIncome ? formData.paymentMethodId : undefined,
      incomePaymentMethod: isIncome ? (formData.incomePaymentMethod as IncomePaymentMethod) : undefined,
      ...(formData.clientId && { clientId: formData.clientId }),
    });

    setOpen(false);
    setFormData({
      type: defaultType || 'income',
      amount: '',
      category: '',
      description: '',
      paymentMethodId: '',
      incomePaymentMethod: '',
      clientId: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const buttonLabel = defaultType === 'income' 
    ? 'Agregar Ingreso' 
    : defaultType === 'expense' 
    ? 'Agregar Gasto' 
    : 'Agregar Transacción';

  const currentType = formData.type;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom">
            <Plus className="w-4 h-4 mr-2" />
            {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border shadow-custom sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {defaultType === 'income' ? 'Nuevo Ingreso' : defaultType === 'expense' ? 'Nuevo Gasto' : 'Nueva Transacción'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!defaultType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Tipo
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) =>
                  setFormData({ ...formData, type: value, paymentMethodId: '', incomePaymentMethod: '' })
                }
              >
                <SelectTrigger className="bg-background border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Monto ($)
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-background border-border rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Categoría
            </Label>
            <Input
              placeholder="Ej: Consultoría, Software, Marketing"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-background border-border rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Descripción
            </Label>
            <Textarea
              placeholder="Detalle de la transacción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background border-border rounded-xl"
              rows={3}
            />
          </div>

          {/* For Income: show fixed payment methods (Stripe, Transferencia, Efectivo) */}
          {currentType === 'income' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Método de Pago del Cliente
              </Label>
              <Select
                value={formData.incomePaymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, incomePaymentMethod: value })
                }
                required
              >
                <SelectTrigger className="bg-background border-border rounded-xl">
                  <SelectValue placeholder="¿Cómo te pagó el cliente?" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {INCOME_PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* For Expense: show user's own payment methods */}
          {currentType === 'expense' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                ¿Con qué tarjeta/cuenta pagaste?
              </Label>
              <Select
                value={formData.paymentMethodId}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethodId: value })
                }
                required
              >
                <SelectTrigger className="bg-background border-border rounded-xl">
                  <SelectValue placeholder="Seleccionar tu método de pago" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {paymentMethods.filter(pm => pm.type === 'tarjeta' || pm.type === 'banco' || pm.type === 'digital').map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentType === 'income' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Cliente (Opcional)
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
              >
                <SelectTrigger className="bg-background border-border rounded-xl">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}{client.company ? ` (${client.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Fecha
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-background border-border rounded-xl"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom"
            >
              {defaultType === 'income' ? 'Agregar Ingreso' : defaultType === 'expense' ? 'Agregar Gasto' : 'Agregar Transacción'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-border rounded-2xl"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
