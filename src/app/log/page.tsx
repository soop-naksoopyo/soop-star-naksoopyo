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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  Download,
  ExternalLink,
  Layers,
  Timer,
  Database,
  SlidersHorizontal,
  Terminal,
  TrendingUp,
} from 'lucide-react';
import { type SyncLogEntry, type FailedStreamerInfo, type StreamerChangeInfo } from '@/types/sync';

export default function SyncLogSecretPage() {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRawJsonMap, setShowRawJsonMap] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Log request failed');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.logs)) throw new Error('Invalid log response');
      setLogs(data.logs);
      setLoadWarning(data.warning ?? null);
      setLastChecked(new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()));
    } catch (err) {
      console.error('Failed to load logs:', err);
      setLoadWarning('최신 로그를 불러오지 못했습니다. 마지막으로 확인한 기록을 표시합니다.');
    } finally {
      setIsLoading(false);
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

  // 필터 또는 페이지 크기 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, monthFilter, search, pageSize]);

  // GitHub Actions에 설정된 수집 예약 간격.
  const currentScheduleInfo = useMemo(() => {
    return {
      label: '10분 간격 예약',
      detail: 'GitHub Actions 자동 수집. 예약 시각보다 실제 시작이 지연될 수 있습니다.',
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

  // 누적 통계 지표
  const statsSummary = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === 'success').length;
    const rate = total > 0 ? Math.round((success / total) * 1000) / 10 : 100;
    const avgDuration = total > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.durationSeconds ?? 90), 0) / total)
      : 90;
    return { total, success, rate, avgDuration };
  }, [logs]);

  // 페이징 계산
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = pageSize === 0 ? filteredLogs.length : Math.min(startIndex + pageSize, filteredLogs.length);
  const paginatedLogs = useMemo(() => {
    return pageSize === 0 ? filteredLogs : filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, pageSize, startIndex, endIndex]);

  // 스마트 페이지 번호 목록
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  // 단일 행 열기/닫기
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 현재 페이지 전체 펼치기 / 접기
  const isAllExpanded = paginatedLogs.length > 0 && paginatedLogs.every((l) => expandedRows.has(l.id));
  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        paginatedLogs.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        paginatedLogs.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  // JSON 클립보드 복사
  const handleCopyJson = (log: SyncLogEntry) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // 로그 JSON 파일 내보내기
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `soopscope-sync-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50 border border-slate-700 cursor-pointer"
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
            스트리머별 별풍선/뷰어십 지표 수집 성공 여부와 소요 시간을 확인합니다. 로그는 15초마다 다시 조회합니다.
          </p>
        </div>

        {loadWarning && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">{loadWarning}</p>}

        {/* 핵심 상태 요약 카드 4종 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. 현재 수집 스케줄 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>수집 스케줄</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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

          {/* 3. 최근 수집 현황 */}
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
              {latestRun ? `${Math.min(latestRun.fetchedCount, latestRun.requestedCount)} / ${latestRun.requestedCount}명` : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {latestRun
                ? latestRun.failedCount === 0
                  ? '결측 0명 (100% 정상 수집 완료)'
                  : `결측 ${latestRun.failedCount}명 발생 (재시도 대기)`
                : '-'}
            </div>
          </div>

          {/* 4. 기록 보관 수 & 평균 성능 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>누적 기록 & 성공률</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {statsSummary.rate}%
              </span>
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white tabular-nums">
              총 {statsSummary.total}회차 ({statsSummary.success}회 성공)
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              평균 수집 시간 약 {statsSummary.avgDuration}초 (10 Shards)
            </div>
          </div>
        </div>

        {/* 필터, 검색 및 액션 툴바 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* 상태 필터 */}
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                전체 ({logs.length})
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === 'success' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                성공 (100%)
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === 'failed' ? 'bg-rose-600/30 text-rose-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                결측/실패
              </button>
            </div>

            {/* 월별 필터 */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-700 cursor-pointer"
            >
              <option value="all">모든 대상 월</option>
              <option value="2026-10">2026년 10월</option>
              <option value="2026-09">2026년 9월</option>
            </select>

            {/* 페이지당 표시 개수 */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-700 cursor-pointer"
            >
              <option value={10}>10개씩 보기</option>
              <option value={15}>15개씩 보기</option>
              <option value={25}>25개씩 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={0}>전체 보기</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* 전체 펼치기 / 접기 토글 */}
            <button
              onClick={toggleExpandAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title={isAllExpanded ? '모든 행 접기' : '현재 페이지 모든 행 펼치기'}
            >
              {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isAllExpanded ? '전체 접기' : '전체 상세 펼치기'}</span>
            </button>

            {/* JSON 내보내기 */}
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title="필터링된 로그를 JSON 파일로 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>로그 JSON 저장</span>
            </button>

            {/* 검색창 */}
            <div className="relative min-w-[180px] sm:min-w-[200px]">
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
                  <th className="py-3 px-3 text-right">결측</th>
                  <th className="py-3 px-3 text-center">소요 시간</th>
                  <th className="py-3 px-4 text-center">성공률</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      {isLoading ? '수집 로그를 불러오는 중입니다...' : '조건에 맞는 수집 로그 기록이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const effectiveFetched = Math.min(log.fetchedCount, log.requestedCount);
                    const successRate = log.requestedCount > 0
                      ? Math.min(100, Math.round((effectiveFetched / log.requestedCount) * 1000) / 10)
                      : 100;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => toggleRow(log.id)}
                          className="hover:bg-slate-800/40 transition cursor-pointer select-none"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{log.kstTime}</span>
                            </div>
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
                            {effectiveFetched}명
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            {log.failedCount === 0 ? (
                              <span className="text-slate-500">0</span>
                            ) : (
                              <span className="text-rose-400 font-bold">-{log.failedCount}명</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-400 whitespace-nowrap">
                            {log.durationSeconds ? `${log.durationSeconds}초` : '약 90초'}
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
                                {log.changedCount !== undefined && log.changedCount > 0 ? (
                                  <span className="text-amber-300 font-semibold ml-0.5">({log.changedCount}명 변동)</span>
                                ) : null}
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(log.id);
                              }}
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition border cursor-pointer ${
                                isExpanded
                                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>{isExpanded ? '닫기' : '상세보기'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* 상세 패널 (대폭 강화된 실행 리포트) */}
                        {isExpanded && (
                          <tr className="bg-slate-900/90 border-b border-slate-800">
                            <td colSpan={10} className="p-4 sm:p-6 text-xs space-y-4">
                              {/* 1. 빠른 메트릭 요약 카드 4종 */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                    <Timer className="w-3.5 h-3.5 text-blue-400" />
                                    수집 소요시간
                                  </div>
                                  <div className="mt-1.5 text-sm sm:text-base font-bold text-white font-mono">
                                    {log.durationSeconds ?? 90}초
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">10개 병렬 Shard 완료</div>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                    수집 성공률
                                  </div>
                                  <div className="mt-1.5 text-sm sm:text-base font-bold text-emerald-400 font-mono">
                                    {successRate}%
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{effectiveFetched} / {log.requestedCount}명 정상 수집</div>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                                    실행 트리거
                                  </div>
                                  <div className="mt-1.5 text-sm sm:text-base font-bold text-white">
                                    {log.trigger === 'manual' ? '수동 실행' : '자동 스케줄'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {log.trigger === 'manual' ? 'workflow_dispatch' : 'GitHub Actions Cron'}
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                                    데이터 변동 감지
                                  </div>
                                  <div className="mt-1.5 text-sm sm:text-base font-bold text-amber-400 font-mono">
                                    {log.changedCount !== undefined ? `${log.changedCount}명` : `${log.changes?.length ?? 0}명`}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">이전 수집 대비 수치 갱신</div>
                                </div>
                              </div>

                              {/* 2. 4단계 수집 파이프라인 단계별 현황 */}
                              <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 sm:p-4">
                                <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                                  수집 파이프라인 단계별 세부 현황
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11px]">
                                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 1단계: 타겟 로스터 확정
                                    </div>
                                    <div className="text-slate-400 text-[10px] leading-relaxed">
                                      14개 크루 + 무소속 = 총 {log.requestedCount}명 인덱싱 완료
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 2단계: Trackify 배치 수집
                                    </div>
                                    <div className="text-slate-400 text-[10px] leading-relaxed">
                                      80명 단위 배치 API 호출 및 비공개 시트 폴백
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 3단계: 지표 산출 & 정합성 검증
                                    </div>
                                    <div className="text-slate-400 text-[10px] leading-relaxed">
                                      별풍선, 방송시간, 뷰어십(viewerShip = avg × min / 60) 산출
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 4단계: Supabase & Git 반영
                                    </div>
                                    <div className="text-slate-400 text-[10px] leading-relaxed">
                                      soopscope_monthly_snapshots 및 변동 로그 갱신
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. 수집 결과 리포트 (성공 vs 실패) */}
                              {log.failedCount === 0 ? (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <div>
                                    <span className="font-bold">결측 없는 100% 정상 수집:</span> {log.requestedCount}명 전체 스트리머의 별풍선 및 뷰어십 데이터가 오류 없이 완벽하게 수집되었습니다.
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40">
                                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                    수집 결측/실패 스트리머 ({log.failedStreamers?.length || log.failedCount}명 발생)
                                  </div>
                                  {log.failedStreamers && log.failedStreamers.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {log.failedStreamers.map((s: FailedStreamerInfo) => (
                                        <span
                                          key={s.soopId}
                                          className="px-2.5 py-1 rounded-md bg-rose-900/40 border border-rose-700/50 text-rose-200 text-[11px] flex items-center gap-1.5"
                                        >
                                          <span className="font-semibold">{s.nickname}</span>
                                          <span className="text-rose-400/80 font-mono text-[10px]">({s.soopId})</span>
                                          {s.crewName && <span className="text-slate-400 text-[10px]">· {s.crewName}</span>}
                                          {s.reason && <span className="text-amber-300 text-[10px]">({s.reason})</span>}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-rose-400/80 text-[11px]">
                                      일시적 네트워크 또는 응답 지연으로 인한 결측입니다. 다음 스케줄에서 자동 재시도됩니다.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 3-1. 바뀐 데이터 실시간 변동 내역 (10000 -> 12000 등) */}
                              {log.changes && log.changes.length > 0 ? (
                                <div className="space-y-2.5 p-3.5 sm:p-4 rounded-lg bg-slate-950/80 border border-amber-500/30">
                                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                                      <span>수치 변동 감지 내역 ({log.changedCount || log.changes.length}명 갱신)</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-normal">이전 수집 대비 변경치</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                    {log.changes.map((c: StreamerChangeInfo) => (
                                      <div
                                        key={c.soopId}
                                        className="p-2.5 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] flex flex-col gap-1.5"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-slate-200">
                                            {c.nickname}{' '}
                                            <span className="text-slate-400 text-[10px]">({c.crewName || '무소속'})</span>
                                          </span>
                                          <span className="text-slate-500 font-mono text-[10px]">{c.soopId}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                                          <span className="text-slate-400 text-[10px]">별풍선:</span>
                                          <span className="tabular-nums flex items-center gap-1">
                                            <span className="text-slate-400">{c.prevStars.toLocaleString()}</span>
                                            <span className="text-slate-500">➔</span>
                                            <span className="text-amber-400 font-bold">{c.newStars.toLocaleString()}</span>
                                            {c.diffStars > 0 && (
                                              <span className="text-emerald-400 font-bold text-[10px]">(+{c.diffStars.toLocaleString()})</span>
                                            )}
                                          </span>
                                        </div>

                                        {(c.diffHours !== undefined && c.diffHours !== 0) && (
                                          <div className="flex items-center justify-between text-[11px] font-mono">
                                            <span className="text-slate-400 text-[10px]">방송시간:</span>
                                            <span className="tabular-nums flex items-center gap-1">
                                              <span className="text-slate-400">{c.prevHours}시간</span>
                                              <span className="text-slate-500">➔</span>
                                              <span className="text-blue-400 font-bold">{c.newHours}시간</span>
                                              {c.diffHours > 0 && (
                                                <span className="text-emerald-400 font-bold text-[10px]">(+{c.diffHours}h)</span>
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* 4. 타임스탬프 & 비고 & 액션 도구 */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span><strong className="text-slate-300">KST:</strong> <span className="font-mono">{log.kstTime}</span></span>
                                  <span><strong className="text-slate-300">UTC:</strong> <span className="font-mono">{log.timestamp}</span></span>
                                  {log.note && (
                                    <span><strong className="text-slate-300">비고:</strong> {log.note}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyJson(log)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] border border-slate-700 font-medium cursor-pointer"
                                  >
                                    {copiedId === log.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">복사됨!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>JSON 복사</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setShowRawJsonMap((prev) => ({ ...prev, [log.id]: !prev[log.id] }))}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] border border-slate-700 cursor-pointer"
                                  >
                                    <Terminal className="w-3 h-3" />
                                    <span>{showRawJsonMap[log.id] ? 'JSON 닫기' : 'Raw JSON'}</span>
                                  </button>
                                  <a
                                    href="https://github.com/soop-naksoopyo/soop-star-naksoopyo/actions/workflows/sync-soopscope.yml"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] border border-slate-700"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>GitHub Action</span>
                                  </a>
                                </div>
                              </div>

                              {/* 5. 접이식 Raw JSON 블록 */}
                              {showRawJsonMap[log.id] && (
                                <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800/90 overflow-x-auto">
                                  <pre className="text-[11px] font-mono text-emerald-300 leading-relaxed whitespace-pre">
                                    {JSON.stringify(log, null, 2)}
                                  </pre>
                                </div>
                              )}
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

          {/* 페이징 네비게이션 바 */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
              <div className="font-mono text-[11px]">
                총 <strong className="text-slate-200">{filteredLogs.length}</strong>개 로그 중{' '}
                <strong className="text-slate-200">{startIndex + 1} ~ {endIndex}</strong>번째 표시{' '}
                (페이지 <strong className="text-emerald-400">{safePage}</strong> / {totalPages})
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* 첫 페이지 */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-300 cursor-pointer"
                    title="첫 페이지"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* 이전 페이지 */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-300 cursor-pointer"
                    title="이전 페이지"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* 스마트 페이지 번호 버튼들 */}
                  <div className="flex items-center gap-1 px-1">
                    {paginationRange.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 text-slate-600 font-mono">
                            …
                          </span>
                        );
                      }
                      const pageNum = Number(p);
                      const isCurrent = pageNum === safePage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[28px] h-7 px-2 font-mono text-xs rounded-md transition cursor-pointer font-semibold ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* 다음 페이지 */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-300 cursor-pointer"
                    title="다음 페이지"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* 마지막 페이지 */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-300 cursor-pointer"
                    title="마지막 페이지"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 안내 설명 */}
        <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1">
          <div className="font-bold text-slate-300">💡 숲스코프 자동 수집 파이프라인 안내</div>
          <div>• 자동 수집은 10분 간격으로 예약돼 있으며, GitHub Actions 사정에 따라 실제 시작은 지연될 수 있습니다.</div>
          <div>• 완료된 수집 로그는 DB에 저장되고, 이 화면은 15초마다 새 기록을 조회합니다.</div>
          <div>• **비밀 페이지:** 본 페이지는 URL(`/log`)을 직접 입력해야만 진입할 수 있으며 메인 화면 메뉴에는 표시되지 않습니다.</div>
        </div>
      </div>
    </div>
  );
}
