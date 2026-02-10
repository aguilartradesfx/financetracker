import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction } from '@/types/finance';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DayData {
  date: Date;
  hasIncome: boolean;
  hasExpense: boolean;
  isCurrentMonth: boolean;
}

export function TransactionCalendar() {
  const { transactions } = useFinanceStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dayDataMap = useMemo(() => {
    const map = new Map<string, DayData>();
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(tx => 
        format(tx.date, 'yyyy-MM-dd') === dateKey
      );
      
      map.set(dateKey, {
        date: day,
        hasIncome: dayTransactions.some(tx => tx.type === 'income'),
        hasExpense: dayTransactions.some(tx => tx.type === 'expense'),
        isCurrentMonth: day >= monthStart && day <= monthEnd
      });
    });
    
    return map;
  }, [days, transactions, monthStart, monthEnd]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    return transactions.filter(tx => 
      format(tx.date, 'yyyy-MM-dd') === dateKey
    );
  }, [selectedDay, transactions]);

  const incomeTransactions = selectedDayTransactions.filter(tx => tx.type === 'income');
  const expenseTransactions = selectedDayTransactions.filter(tx => tx.type === 'expense');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Card className="bg-[#221c28] border-[#352e3d] p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="bg-[#1a1520] border-[#352e3d] text-white hover:bg-[#352e3d] h-7 px-2 text-xs"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="bg-[#1a1520] border-[#352e3d] text-white hover:bg-[#352e3d] h-7 w-7 p-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="bg-[#1a1520] border-[#352e3d] text-white hover:bg-[#352e3d] h-7 w-7 p-0"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dayDataMap.get(dateKey);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDay(day)}
                className={`
                  relative h-10 rounded-lg text-xs font-medium
                  transition-colors hover:bg-[#352e3d]
                  ${dayData?.isCurrentMonth ? 'text-white' : 'text-muted-foreground'}
                  ${isSelected ? 'bg-orange-500/20 border-2 border-orange-500' : 'border border-transparent'}
                  ${isTodayDate && !isSelected ? 'border-orange-500/50' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="leading-none">{format(day, 'd')}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {dayData?.hasIncome && (
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                    )}
                    {dayData?.hasExpense && (
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Day Details */}
        {selectedDay && (
          <div className="border-t border-[#352e3d] pt-2 mt-2 max-h-48 overflow-y-auto">
            <h4 className="text-xs font-semibold text-white mb-2">
              {format(selectedDay, "d 'de' MMM", { locale: es })}
            </h4>

            {selectedDayTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin movimientos</p>
            ) : (
              <div className="space-y-2">
                {/* Income */}
                {incomeTransactions.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium text-green-500 uppercase">
                      Ingresos ({incomeTransactions.length})
                    </h5>
                    {incomeTransactions.map(tx => (
                      <div
                        key={tx.id}
                        className="flex items-start justify-between p-2 bg-[#1a1520] rounded border border-[#352e3d]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs font-medium text-white">
                              ${tx.amount.toFixed(2)}
                            </p>
                            {tx.incomePaymentMethod && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-500/10 text-green-500 border-green-500/30 py-0 px-1"
                              >
                                {tx.incomePaymentMethod}
                              </Badge>
                            )}
                          </div>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expenses */}
                {expenseTransactions.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium text-red-500 uppercase">
                      Gastos ({expenseTransactions.length})
                    </h5>
                    {expenseTransactions.map(tx => (
                      <div
                        key={tx.id}
                        className="flex items-start justify-between p-2 bg-[#1a1520] rounded border border-[#352e3d]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs font-medium text-white">
                              ${tx.amount.toFixed(2)}
                            </p>
                            {tx.category && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-500/10 text-red-500 border-red-500/30 py-0 px-1"
                              >
                                {tx.category}
                              </Badge>
                            )}
                          </div>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
