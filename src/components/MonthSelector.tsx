'use client';

import React from 'react';
import { Calendar, Archive, Radio } from 'lucide-react';

export type MonthOption = '2026-10' | '2026-09';

interface MonthSelectorProps {
  selectedMonth: MonthOption;
  onSelectMonth: (month: MonthOption) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onSelectMonth,
}) => {
  const options: { id: MonthOption; title: string; badge: string; isLive: boolean }[] = [
    {
      id: '2026-10',
      title: '2026년 10월',
      badge: 'LIVE 진행중',
      isLive: true,
    },
    {
      id: '2026-09',
      title: '2026년 9월',
      badge: '마감 아카이브',
      isLive: false,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-[#0a0e16] border border-[#1b2332] p-1 rounded-xl">
      {options.map((opt) => {
        const isSelected = selectedMonth === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectMonth(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition flex items-center gap-2 cursor-pointer ${
              isSelected
                ? opt.isLive
                  ? 'bg-[#12211d] text-[#00dc82] border border-[#00dc82]/40 shadow-xs'
                  : 'bg-[#1d1b2e] text-[#a78bfa] border border-[#a78bfa]/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#121824]'
            }`}
          >
            {opt.isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00dc82] animate-pulse" />
                <span>{opt.title}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>{opt.title}</span>
              </span>
            )}

            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                isSelected
                  ? opt.isLive
                    ? 'bg-[#00dc82]/20 text-[#00dc82]'
                    : 'bg-[#a78bfa]/20 text-[#a78bfa]'
                  : 'bg-[#151d2a] text-slate-400'
              }`}
            >
              {opt.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
