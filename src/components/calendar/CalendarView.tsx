import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/finance';

interface CalendarViewProps {
  transactions: Transaction[];
}

export function CalendarView({ transactions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const transactionsByDate = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  const getDayTransactions = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return transactionsByDate[dateKey] || [];
  };

  const getDayBalance = (day: Date) => {
    const dayTransactions = getDayTransactions(day);
    return dayTransactions.reduce((balance, t) => {
      return t.type === 'income' ? balance + t.amount : balance - t.amount;
    }, 0);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  return (
    <Card className="bg-card border-border shadow-custom p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="rounded-xl border-border"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="rounded-xl border-border"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {daysInMonth.map((day) => {
          const dayTransactions = getDayTransactions(day);
          const dayBalance = getDayBalance(day);
          const hasIncome = dayTransactions.some(t => t.type === 'income');
          const hasExpense = dayTransactions.some(t => t.type === 'expense');
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              className={`
                aspect-square p-2 rounded-xl border-2 
                ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-background'}
                hover:border-primary/50 transition-colors
                flex flex-col items-center justify-center
                relative
              `}
            >
              <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
              
              {dayTransactions.length > 0 && (
                <>
                  <div className="flex gap-1 mb-1">
                    {hasIncome && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                    {hasExpense && (
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${dayBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {dayBalance >= 0 ? '+' : ''}${Math.abs(dayBalance).toLocaleString()}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Expense</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
