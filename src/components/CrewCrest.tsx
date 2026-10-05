'use client';

import React, { useState } from 'react';

// 대학별 공식 엠블럼 매핑 및 고유 컬러/단축명
export const CREW_EMBLEM_MAP: Record<
  string,
  {
    localPath?: string;
    remoteUrl?: string;
    bgColor: string;
    shortName: string;
    shape?: 'circle' | 'rounded';
  }
> = {
  더블비: {
    localPath: '/crests/20.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/20_6d5c8db5.png',
    bgColor: '#eab308',
    shortName: '더블',
  },
  캄몬: {
    localPath: '/crests/26.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/26.png',
    bgColor: '#3b82f6',
    shortName: '캄몬',
  },
  뉴캣슬: {
    localPath: '/crests/19.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/19.png',
    bgColor: '#8b5cf6',
    shortName: '뉴켓',
  },
  케이대: {
    localPath: '/crests/27.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/27_91d24d75.png',
    bgColor: '#f43f5e',
    shortName: '케이',
  },
  와플대: {
    localPath: '/crests/25.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/25.png',
    bgColor: '#f97316',
    shortName: '와플',
  },
  드림즈: {
    localPath: '/crests/21.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/21.png',
    bgColor: '#06b6d4',
    shortName: '드림',
  },
  신세계: {
    localPath: '/crests/23.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/23.png',
    bgColor: '#10b981',
    shortName: '신세',
  },
  JSA: {
    localPath: '/crests/18.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/18.png',
    bgColor: '#ec4899',
    shortName: 'JSA',
  },
  마범대: {
    localPath: '/crests/24.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/24.png',
    bgColor: '#a855f7',
    shortName: '마범',
  },
  BGM: {
    localPath: '/crests/15.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/15.png',
    bgColor: '#6366f1',
    shortName: 'BGM',
  },
  흑카데미: {
    localPath: '/crests/28.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/28.png',
    bgColor: '#64748b',
    shortName: '흑카',
  },
  DM: {
    localPath: '/crests/16.png',
    remoteUrl: 'https://eloboard.co.kr/static/colleges/16.png',
    bgColor: '#14b8a6',
    shortName: 'DM',
  },
  광준: { bgColor: '#6C8A5A', shortName: '광준' },
  극락회: { bgColor: '#6C8A5A', shortName: '극락', shape: 'rounded' },
  소병대: { bgColor: '#7C5CFF', shortName: '소병' },
};

interface CrewCrestProps {
  crewName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CrewCrestImage: React.FC<CrewCrestProps> = ({
  crewName,
  size = 'md',
  className = '',
}) => {
  const info = CREW_EMBLEM_MAP[crewName] || {
    bgColor: '#475569',
    shortName: crewName.slice(0, 2),
  };

  const [imgSrc, setImgSrc] = useState<string | null>(
    info.localPath || info.remoteUrl || null
  );
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (imgSrc === info.localPath && info.remoteUrl) {
      setImgSrc(info.remoteUrl);
    } else {
      setHasError(true);
    }
  };

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
    xl: 'w-12 h-12 sm:w-14 sm:h-14 text-base',
  }[size];

  if (imgSrc && !hasError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-white border border-slate-200 overflow-hidden p-0.5 shadow-xs ${sizeClasses} ${className}`}
      >
        <img
          src={imgSrc}
          alt={`${crewName} 마크`}
          className="w-full h-full object-contain"
          onError={handleImgError}
          loading="lazy"
        />
      </div>
    );
  }

  const fallbackShortName = size === 'xs' || size === 'sm'
    ? info.shortName.slice(0, 1)
    : info.shortName;
  const shapeClass = info.shape === 'rounded' ? 'rounded-2xl' : 'rounded-full';

  return (
    <div
      style={{ backgroundColor: info.bgColor }}
      className={`inline-flex items-center justify-center shrink-0 ${shapeClass} font-bold text-white shadow-xs border border-white/20 select-none ${sizeClasses} ${className}`}
      title={`${crewName} 마크`}
    >
      <span className={`whitespace-nowrap leading-none ${size === 'md' ? 'text-[9px] sm:text-[10px]' : ''}`}>
        {fallbackShortName}
      </span>
    </div>
  );
};

export const CrewCrest: React.FC<CrewCrestProps> = (props) => (
  <CrewCrestImage key={props.crewName} {...props} />
);
