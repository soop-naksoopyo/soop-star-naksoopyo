import React from 'react';
import { CrewCrest } from '@/components/CrewCrest';

interface CrewAffiliationProps {
  crewName?: string | null;
  emptyLabel?: string;
  desktopEmptyLabel?: string;
}

export const CrewAffiliation: React.FC<CrewAffiliationProps> = ({ crewName, emptyLabel, desktopEmptyLabel }) => (
  <span className="inline-flex h-9 w-10 shrink-0 items-center justify-center sm:h-10">
    {crewName
      ? <CrewCrest crewName={crewName} size="lg" />
      : desktopEmptyLabel
        ? <>
            <span className="whitespace-nowrap text-[9px] font-medium text-slate-400 sm:hidden">{emptyLabel ?? '-'}</span>
            <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 sm:inline">{desktopEmptyLabel}</span>
          </>
        : <span className="whitespace-nowrap text-[9px] font-medium text-slate-400">{emptyLabel ?? '-'}</span>}
  </span>
);
