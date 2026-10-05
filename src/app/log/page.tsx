'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Radio,
  Lock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { type SyncLogEntry, type FailedStreamerInfo } from '@/data/syncLogs';

export default function SyncLogSecretPage() {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoading(false);
      const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
      setLastChecked(kst.toISOString().replace('T', ' ').slice(11, 19));
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 15초 자동 갱신
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 한국 시간 기준 현재 스케줄 상태 (피크타임 vs 평소)
  const currentScheduleInfo = useMemo(() => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const hour = kst.getUTCHours();
    const isPeak = hour >= 17 || hour < 2;
    return {
      isPeak,
      label: isPeak ? '피크타임 (10분 주기)' : '평소 (30분 주기)',
      detail: isPeak
        ? '한국시간 17:00 ~ 02:00 진행 중 (10분마다 자동 수집)'
        : '한국시간 02:00 ~ 17:00 진행 중 (30분마다 자동 수집)',
    };
  }, []);

  // 필터링된 로그 목록
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter === 'success' && log.status !== 'success') return false;
      if (statusFilter === 'failed' && log.status === 'success') return false;
      if (monthFilter !== 'all' && log.yearMonth !== monthFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesTime = log.kstTime.toLowerCase().includes(term);
        const matchesMonth = log.yearMonth.toLowerCase().includes(term);
        const matchesNote = log.note?.toLowerCase().includes(term) ?? false;
        const matchesFailed = log.failedStreamers.some(
          (s) => s.nickname.toLowerCase().includes(term) || s.soopId.toLowerCase().includes(term)
        );
        if (!matchesTime && !matchesMonth && !matchesNote && !matchesFailed) return false;
      }
      return true;
    });
  }, [logs, statusFilter, monthFilter, search]);

  const latestRun = logs[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 상단 네비게이션 & 비밀 페이지 안내 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              메인 대시보드
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <Lock className="w-3 h-3" />
              비공개 관리자 로그 (/log)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
              />
              15초 자동 새로고침
            </label>
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              새로고침 {lastChecked && `(${lastChecked})`}
            </button>
          </div>
        </div>

        {/* 헤더 타이틀 */}
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              숲스코프 데이터 수집 & 갱신 모니터링 콘솔
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            시간대별 수집 대상 전체 인원, 성공/실패 여부 및 갱신 시각을 실시간 추적합니다.
          </p>
        </div>

        {/* 핵심 상태 요약 카드 4종 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. 현재 수집 스케줄 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>수집 스케줄</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentScheduleInfo.isPeak ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
              {currentScheduleInfo.label}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {currentScheduleInfo.detail}
            </div>
          </div>

          {/* 2. 최근 갱신 시각 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>최근 갱신 시각</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white tabular-nums">
              {latestRun ? latestRun.kstTime.split(' ')[1] : '대기 중'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {latestRun ? `${latestRun.kstTime.split(' ')[0]} KST` : '-'}
            </div>
          </div>

          {/* 3. 최근 수집 결과 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>최근 수집 현황</span>
              {latestRun?.failedCount === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
              {latestRun ? `${latestRun.fetchedCount} / ${latestRun.requestedCount}명` : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {latestRun
                ? latestRun.failedCount === 0
                  ? '실패 0명 (100% 정상 수집)'
                  : `실패 ${latestRun.failedCount}명 발생`
                : '-'}
            </div>
          </div>

          {/* 4. 기록 보관 수 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>누적 기록</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">History</span>
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white tabular-nums">
              총 {logs.length}회차 기록
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              최신 100회차까지 영구 보존
            </div>
          </div>
        </div>

        {/* 필터 및 검색 바 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* 상태 필터 */}
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                전체 ({logs.length})
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === 'success' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                성공 (100%)
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === 'failed' ? 'bg-rose-600/30 text-rose-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                실패/지연
              </button>
            </div>

            {/* 월별 필터 */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-700"
            >
              <option value="all">모든 대상 월</option>
              <option value="2026-10">2026년 10월</option>
              <option value="2026-09">2026년 9월</option>
            </select>
          </div>

          {/* 검색창 */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="시간, 월, 비고 검색..."
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* 수집 로그 테이블 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">갱신 일시 (KST)</th>
                  <th className="py-3 px-3">대상 월</th>
                  <th className="py-3 px-3">수집 유형</th>
                  <th className="py-3 px-3 text-right">전체 인원</th>
                  <th className="py-3 px-3 text-right">성공</th>
                  <th className="py-3 px-3 text-right">실패</th>
                  <th className="py-3 px-4 text-center">성공률</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      {isLoading ? '수집 로그를 불러오는 중입니다...' : '조건에 맞는 수집 로그 기록이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    const successRate = log.requestedCount > 0
                      ? Math.round((log.fetchedCount / log.requestedCount) * 1000) / 10
                      : 100;

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                            {log.kstTime}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                              {log.yearMonth}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.trigger === 'schedule'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {log.trigger === 'schedule' ? '자동 스케줄' : '수동 트리거'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                            {log.requestedCount}명
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold whitespace-nowrap">
                            {log.fetchedCount}명
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            {log.failedCount === 0 ? (
                              <span className="text-slate-500">0</span>
                            ) : (
                              <span className="text-rose-400 font-bold">-{log.failedCount}명</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    successRate === 100 ? 'bg-emerald-500' : successRate >= 90 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] tabular-nums font-semibold">
                                {successRate}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> 정상 완료
                              </span>
                            ) : log.status === 'partial' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> 부분 수집
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" /> 수집 실패
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {log.failedCount > 0 || log.note ? (
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {log.failedCount > 0 ? `실패 ${log.failedCount}명 확인` : '상세'}
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>

                        {/* 확장 상세 패널 (비고 및 실패자 목록) */}
                        {isExpanded && (
                          <tr className="bg-slate-900/90 border-b border-slate-800">
                            <td colSpan={9} className="p-4 text-xs">
                              <div className="space-y-2">
                                {log.note && (
                                  <div className="text-slate-300">
                                    <span className="font-semibold text-slate-400">비고: </span>
                                    {log.note}
                                  </div>
                                )}
                                {log.failedStreamers && log.failedStreamers.length > 0 && (
                                  <div>
                                    <div className="font-semibold text-rose-400 mb-1">
                                      수집 실패 스트리머 ({log.failedStreamers.length}명):
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {log.failedStreamers.map((s: FailedStreamerInfo) => (
                                        <span
                                          key={s.soopId}
                                          className="px-2 py-0.5 rounded bg-rose-950/50 border border-rose-800/40 text-rose-300 text-[11px]"
                                        >
                                          {s.nickname} ({s.soopId}) {s.crewName && `· ${s.crewName}`}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 안내 설명 */}
        <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1">
          <div className="font-bold text-slate-300">💡 숲스코프 자동 수집 파이프라인 안내</div>
          <div>• **피크타임 (17:00 ~ 02:00 KST):** 10분마다 10개 샤드로 병렬 수집되어 자동 갱신됩니다.</div>
          <div>• **평소 시간 (02:00 ~ 17:00 KST):** 30분마다 10개 샤드로 병렬 수집되어 자동 갱신됩니다.</div>
          <div>• **비밀 페이지:** 본 페이지는 URL(`/log`)을 직접 입력해야만 진입할 수 있으며 메인 화면 메뉴에는 표시되지 않습니다.</div>
        </div>
      </div>
    </div>
  );
}
