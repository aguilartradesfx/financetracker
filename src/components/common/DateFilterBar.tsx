import { useFinanceStore, DateRangeType } from '@/store/financeStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'currentMonth', label: 'Mes a mes' },
  { value: 'last3months', label: 'Últimos 3 meses' },
  { value: 'last12months', label: 'Últimos 12 meses' },
  { value: 'allTime', label: 'Desde el inicio' },
];

export function DateFilterBar() {
  const { dateFilter, setDateFilter, navigateMonth } = useFinanceStore();

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const currentDisplayMonth = dateFilter.customMonth || dateFilter.startDate;

  return (
    <div className="flex items-center gap-4 bg-[#221c28] p-4 rounded-lg border border-zinc-800">
      <Select
        value={dateFilter.type}
        onValueChange={(value) => setDateFilter(value as DateRangeType)}
      >
        <SelectTrigger className="w-[200px] bg-[#1a1520] border-zinc-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {dateFilter.type === 'currentMonth' && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="bg-[#1a1520] border-zinc-700 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-zinc-300 min-w-[180px] text-center capitalize">
            {formatMonthYear(currentDisplayMonth)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="bg-[#1a1520] border-zinc-700 hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {dateFilter.type !== 'currentMonth' && (
        <span className="text-sm text-zinc-400">
          {dateFilter.startDate.toLocaleDateString('es-ES')} - {dateFilter.endDate.toLocaleDateString('es-ES')}
        </span>
      )}
    </div>
  );
}
