import { useState } from 'react';
import { Plus, Users, Trash2, Edit2, HelpCircle, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFinanceStore } from '@/store/financeStore';
import { Client, IncomePaymentMethod, INCOME_PAYMENT_METHODS } from '@/types/finance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ClientManagement() {
  const { clients, addClient, updateClient, deleteClient } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    totalInvoice: '',
    totalPaid: '',
    myCost: '',
    totalCharged: '',
    paymentMethod: 'stripe' as IncomePaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      totalInvoice: '',
      totalPaid: '',
      myCost: '',
      totalCharged: '',
      paymentMethod: 'stripe',
      paymentDate: new Date().toISOString().split('T')[0],
    });
    setEditingClient(null);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      totalInvoice: client.totalInvoice.toString(),
      totalPaid: client.totalPaid.toString(),
      myCost: client.myCost.toString(),
      totalCharged: client.totalCharged.toString(),
      paymentMethod: client.paymentMethod || 'stripe',
      paymentDate: client.lastPaymentDate 
        ? new Date(client.lastPaymentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentDate = new Date(formData.paymentDate);

    if (editingClient) {
      updateClient(editingClient.id, {
        name: formData.name,
        company: formData.company,
        totalInvoice: parseFloat(formData.totalInvoice) || 0,
        totalPaid: parseFloat(formData.totalPaid) || 0,
        myCost: parseFloat(formData.myCost) || 0,
        totalCharged: parseFloat(formData.totalCharged) || 0,
        paymentMethod: formData.paymentMethod,
        lastPaymentDate: paymentDate,
      });
    } else {
      addClient({
        name: formData.name,
        company: formData.company,
        totalInvoice: parseFloat(formData.totalInvoice) || 0,
        totalPaid: parseFloat(formData.totalPaid) || 0,
        myCost: parseFloat(formData.myCost) || 0,
        totalCharged: parseFloat(formData.totalCharged) || 0,
        paymentMethod: formData.paymentMethod,
        lastPaymentDate: paymentDate,
      });
    }

    setOpen(false);
    resetForm();
  };

  // Totals
  const totals = clients.reduce(
    (acc, c) => ({
      totalInvoice: acc.totalInvoice + c.totalInvoice,
      totalPaid: acc.totalPaid + c.totalPaid,
      remaining: acc.remaining + (c.totalInvoice - c.totalPaid),
      myCost: acc.myCost + c.myCost,
      totalCharged: acc.totalCharged + c.totalCharged,
    }),
    { totalInvoice: 0, totalPaid: 0, remaining: 0, myCost: 0, totalCharged: 0 }
  );

  return (
    <Card className="bg-card border-border shadow-custom p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Clientes</h3>
            <p className="text-sm text-muted-foreground">{clients.length} clientes en total</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-custom sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Nombre</Label>
                  <Input
                    placeholder="Nombre del cliente"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Empresa</Label>
                  <Input
                    placeholder="Nombre de la empresa"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">Factura Total ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Monto total que le facturaste al cliente</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalInvoice}
                    onChange={(e) => setFormData({ ...formData, totalInvoice: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">Método de Pago</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">¿Cómo te paga este cliente? Se usará automáticamente al registrar cobros</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: IncomePaymentMethod) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="bg-background border-border rounded-xl">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {INCOME_PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5" />
                            {pm.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm font-medium text-foreground">Fecha de Pago</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Fecha real en la que recibiste el pago</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="bg-background border-border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">Pagado ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Cuánto ha pagado el cliente de la factura total (solo seguimiento - no afecta Dashboard)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalPaid}
                    onChange={(e) => setFormData({ ...formData, totalPaid: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">Mi Costo ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Tus costos para realizar el proyecto (gastos, herramientas, etc.)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.myCost}
                    onChange={(e) => setFormData({ ...formData, myCost: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">Cobrado ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">✅ AUTOMÁTICO: Cuándo incrementes este valor, se creará un ingreso automático en el Dashboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalCharged}
                    onChange={(e) => setFormData({ ...formData, totalCharged: e.target.value })}
                    className="bg-background border-border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-custom"
                >
                  {editingClient ? 'Guardar Cambios' : 'Agregar Cliente'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="flex-1 border-border rounded-2xl"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>



      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay clientes aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega tu primer cliente para comenzar
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-muted-foreground font-semibold">Cliente</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Método de Pago</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Factura Total</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Pagado</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Restante</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Mi Costo</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Cobrado</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const remaining = client.totalInvoice - client.totalPaid;
                return (
                  <TableRow key={client.id} className="hover:bg-background/30">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.company}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.paymentMethod === 'stripe'
                            ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                            : client.paymentMethod === 'transferencia'
                            ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                            : 'border-green-500/50 text-green-400 bg-green-500/10'
                        }
                      >
                        {INCOME_PAYMENT_METHODS.find(pm => pm.value === client.paymentMethod)?.label || 'Stripe'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      ${client.totalInvoice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-500">
                      ${client.totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${remaining > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                      ${remaining.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      ${client.myCost.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      ${client.totalCharged.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(client)}
                          className="rounded-xl hover:bg-primary/10 hover:text-primary h-8 w-8"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteClient(client.id)}
                          className="rounded-xl hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals row */}
              <TableRow className="bg-background/50 hover:bg-background/50 border-t-2 border-border">
                <TableCell className="font-bold text-foreground">Totales</TableCell>
                <TableCell />
                <TableCell className="text-right font-bold text-foreground">
                  ${totals.totalInvoice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-green-500">
                  ${totals.totalPaid.toLocaleString()}
                </TableCell>
                <TableCell className={`text-right font-bold ${totals.remaining > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                  ${totals.remaining.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  ${totals.myCost.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  ${totals.totalCharged.toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
