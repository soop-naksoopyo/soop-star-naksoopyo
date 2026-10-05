import React from 'react';
import Link from 'next/link';
import { ManualSyncButton } from '@/components/admin/ManualSyncButton';
import { StreamerManager } from '@/components/admin/StreamerManager';

export const metadata = {
  title: '관리자 센터 — SOOP 스타크루 대시보드',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#fcf5f7] p-4 sm:p-8 max-w-5xl mx-auto">
      {/* 상단 관리자 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-pink-200/80 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-[#9d2449] hover:underline flex items-center gap-1"
            >
              ← 대시보드로 돌아가기
            </Link>
          </div>
          <h1 className="text-2xl font-black text-[#581c33] mt-1">
            🛠️ 낙수표 관리자 제어 센터
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            스타크루 구성, 스트리머 추가, 즉시 수집 트리거 및 실시간 수집 관리
          </p>
        </div>

        <ManualSyncButton />
      </div>

      {/* 스트리머 & 크루 관리 섹션 */}
      <StreamerManager />
    </div>
  );
}
