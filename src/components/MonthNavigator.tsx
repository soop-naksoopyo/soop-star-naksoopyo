'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigatorProps {
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  selectedMonth,
  availableMonths,
  onSelectMonth,
}) => {
  const selectedMonthIndex = availableMonths.indexOf(selectedMonth);
  const previousMonth = selectedMonthIndex >= 0 ? availableMonths[selectedMonthIndex + 1] : undefined;
  const nextMonth = selectedMonthIndex > 0 ? availableMonths[selectedMonthIndex - 1] : undefined;

  return (
    <div className="flex h-11 w-full shrink-0 items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 sm:w-[220px] sm:px-3.5">
      <button
        type="button"
        onClick={() => previousMonth && onSelectMonth(previousMonth)}
        disabled={!previousMonth}
        aria-label="이전 달"
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 items-center justify-center gap-2">
        <Calendar className="h-4 w-4 shrink-0 text-purple-600" />
        <span className="truncate text-sm font-bold text-slate-900">
          {selectedMonth.slice(0, 4)}년 {Number(selectedMonth.slice(5))}월
        </span>
      </div>
      <button
        type="button"
        onClick={() => nextMonth && onSelectMonth(nextMonth)}
        disabled={!nextMonth}
        aria-label="다음 달"
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
