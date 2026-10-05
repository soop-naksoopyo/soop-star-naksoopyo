'use client';

import React from 'react';
import { MonthNavigator } from '@/components/MonthNavigator';

export type RankingMode = 'crew' | 'individual';

interface RankingSectionHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  mode: RankingMode;
  onModeChange: (mode: RankingMode) => void;
  accessory?: React.ReactNode;
  className?: string;
}

export const RankingSectionHeader: React.FC<RankingSectionHeaderProps> = ({
  title,
  description,
  icon,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  mode,
  onModeChange,
  accessory,
  className = '',
}) => (
  <header className={`flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3 ${className}`}>
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
      </div>
      <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{description}</p>
    </div>
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      {accessory}
      <MonthNavigator
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onSelectMonth={onSelectMonth}
      />
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onModeChange('crew')}
          aria-pressed={mode === 'crew'}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'crew' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          크루별
        </button>
        <button
          type="button"
          onClick={() => onModeChange('individual')}
          aria-pressed={mode === 'individual'}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'individual' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          개인별
        </button>
      </div>
    </div>
  </header>
);
