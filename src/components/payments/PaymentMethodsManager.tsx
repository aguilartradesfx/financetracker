import { useState } from 'react';
import { Plus, CreditCard, Wallet, Building2, Smartphone, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinanceStore } from '@/store/financeStore';
import { PaymentMethod } from '@/types/finance';

export function PaymentMethodsManager() {
  const { paymentMethods, addPaymentMethod, deletePaymentMethod } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'tarjeta' as PaymentMethod['type'],
  });

  // Separar métodos de pago
  const expensePaymentMethods = paymentMethods.filter(pm => 
    pm.type === 'tarjeta' || pm.type === 'banco' || pm.type === 'digital'
  );
  const incomePaymentMethods = [
    { id: 'stripe', name: 'Stripe', type: 'efectivo' as const },
    { id: 'transferencia', name: 'Transferencia Bancaria', type: 'banco' as const },
    { id: 'efectivo', name: 'Efectivo', type: 'efectivo' as const },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addPaymentMethod({
      name: formData.name,
      type: formData.type,
    });

    setOpen(false);
    setFormData({
      name: '',
      type: 'tarjeta',
    });
  };

  const getIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'efectivo':
        return <Wallet className="w-5 h-5" />;
      case 'tarjeta':
        return <CreditCard className="w-5 h-5" />;
      case 'banco':
        return <Building2 className="w-5 h-5" />;
      case 'digital':
        return <Smartphone className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'banco': return 'Banco';
      case 'digital': return 'Digital';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métodos para recibir pagos */}
      <Card className="bg-card border-border shadow-custom p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Métodos para Recibir Pagos</h3>
            <p className="text-sm text-muted-foreground">
              Cómo recibes el dinero de tus clientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {incomePaymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-background border border-green-500/20 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  {getIcon(method.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{method.name}</h4>
                  <p className="text-xs text-muted-foreground">Ingreso</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Métodos para gastos */}
      <Card className="bg-card border-border shadow-custom p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Mis Métodos de Pago</h3>
              <p className="text-sm text-muted-foreground">
                {expensePaymentMethods.length} tarjetas/cuentas para gastos
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Tarjeta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border shadow-custom sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Agregar Método de Pago para Gastos
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Nombre del Método
                  </Label>
                  <Input
                    placeholder="Ej: Visa BBVA, PayPal, Nequi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Tipo
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: PaymentMethod['type']) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="bg-background border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="banco">Cuenta Bancaria</SelectItem>
                      <SelectItem value="digital">Billetera Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom"
                  >
                    Agregar Método
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expensePaymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-background border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {getIcon(method.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{method.name}</h4>
                    <p className="text-xs text-muted-foreground">{getTypeLabel(method.type)}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePaymentMethod(method.id)}
                  className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {expensePaymentMethods.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground">No hay métodos de pago registrados</p>
              <p className="text-sm text-muted-foreground mt-1">
                Agrega tus tarjetas o cuentas para registrar gastos
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
