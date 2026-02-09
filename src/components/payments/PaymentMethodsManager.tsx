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
    <Card className="bg-card border-border shadow-custom p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Métodos de Pago</h3>
            <p className="text-sm text-muted-foreground">
              {paymentMethods.length} métodos registrados
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-custom sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Agregar Método de Pago
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Nombre del Método
                </Label>
                <Input
                  placeholder="Ej: Visa, PayPal, Nequi"
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
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
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
        {paymentMethods.map((method) => (
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

        {paymentMethods.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <p className="text-muted-foreground">No hay métodos de pago</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega un método de pago para registrar transacciones
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
