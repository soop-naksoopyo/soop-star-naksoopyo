'use client';

import React from 'react';
import { Eye, Star } from 'lucide-react';

export type TabType = 'star' | 'rank' | 'viewership';

interface NavTabsProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ currentTab, onTabChange }) => {
  const isStarSection = currentTab !== 'viewership';

  return (
    <nav aria-label="메인 메뉴" className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-300/70 bg-slate-200/70 p-1.5 shadow-inner sm:w-auto">
        <button
          type="button"
          onClick={() => onTabChange('star')}
          aria-pressed={isStarSection}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 sm:px-4 sm:text-sm ${
            isStarSection
              ? 'border border-slate-200/80 bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${isStarSection ? 'text-emerald-600' : 'text-slate-500'}`} />
          별풍선
        </button>
        <button
          type="button"
          onClick={() => onTabChange('viewership')}
          aria-pressed={currentTab === 'viewership'}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 sm:px-4 sm:text-sm ${
            currentTab === 'viewership'
              ? 'border border-slate-200/80 bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Eye className={`h-3.5 w-3.5 ${currentTab === 'viewership' ? 'text-emerald-600' : 'text-slate-500'}`} />
          뷰어십
        </button>
    </nav>
  );
};
