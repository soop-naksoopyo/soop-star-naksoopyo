'use client';

import React from 'react';
import { formatStars } from '@/lib/calculator';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface DiffStreamerItem {
  soopId: string;
  nickname: string;
  crewName: string;
  currentStars: number;
  prevStars: number;
  diffStars: number;
}

interface DiffViewProps {
  items: DiffStreamerItem[];
}

export const DiffView: React.FC<DiffViewProps> = ({ items }) => {
  const sorted = [...items].sort((a, b) => b.diffStars - a.diffStars);

  return (
    <div className="w-full max-w-7xl bg-[#0f141d] rounded-xl border border-[#1e2638] shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#1b2332] mb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00dc82]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              전월 비교분석 (화력 변동 추이)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            지난달 동기 대비 핵심 변동량(▲ / ▼)을 한눈에 비교 분석합니다.
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#151c29]">
        {sorted.map((item, idx) => {
          const isUp = item.diffStars >= 0;
          return (
            <div
              key={item.soopId}
              className="flex items-center justify-between py-2.5 px-3 hover:bg-[#141c2b] rounded-lg transition text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-mono font-medium text-slate-500">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{item.nickname}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#182335] text-slate-300 border border-[#273752]">
                      {item.crewName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    전월 {formatStars(item.prevStars)}개 → 당월 {formatStars(item.currentStars)}개
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`font-bold font-mono text-sm flex items-center justify-end gap-1 ${
                    isUp ? 'text-[#00dc82]' : 'text-rose-400'
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#00dc82]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{isUp ? '+' : '-'}{formatStars(Math.abs(item.diffStars))}개</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {isUp ? '화력 상승' : '화력 감소'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
