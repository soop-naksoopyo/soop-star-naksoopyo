'use client';

import React, { useState } from 'react';

interface RegisteredItem {
  id: string;
  soopId: string;
  nickname: string;
  crewName: string;
  isActive: boolean;
}

const INITIAL_REGISTERED: RegisteredItem[] = [
  { id: '1', soopId: 'roket0829', nickname: '[JS]박퍼니', crewName: '바스포드', isActive: true },
  { id: '2', soopId: 'galsa', nickname: '두치와뿌꾸', crewName: '바스포드', isActive: true },
  { id: '3', soopId: 'hyeri2244', nickname: '혜응이', crewName: '철와대', isActive: true },
  { id: '4', soopId: 'juju0081', nickname: '조이온', crewName: '무친대', isActive: true },
];

export const StreamerManager: React.FC = () => {
  const [streamers, setStreamers] = useState<RegisteredItem[]>(INITIAL_REGISTERED);
  const [soopId, setSoopId] = useState('');
  const [crewName, setCrewName] = useState('바스포드');
  const [loading, setLoading] = useState(false);
  const [previewNickname, setPreviewNickname] = useState('');

  const handleLookup = async () => {
    if (!soopId.trim()) return;
    setLoading(true);
    // 미리보기: SoopScope API 형식 지원
    try {
      setPreviewNickname(`스트리머_${soopId.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soopId.trim()) return;

    const newItem: RegisteredItem = {
      id: String(Date.now()),
      soopId: soopId.trim(),
      nickname: previewNickname || soopId.trim(),
      crewName,
      isActive: true,
    };

    setStreamers([newItem, ...streamers]);
    setSoopId('');
    setPreviewNickname('');
  };

  const handleToggle = (id: string) => {
    setStreamers(
      streamers.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDelete = (id: string) => {
    setStreamers(streamers.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 등록 폼 */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">
        <h2 className="text-lg font-black text-[#581c33] mb-4">
          + 새 스트리머 등록 및 크루 배정
        </h2>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="SOOP 아이디 입력 (예: roket0829)"
              value={soopId}
              onChange={(e) => setSoopId(e.target.value)}
              onBlur={handleLookup}
              className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#9d2449]"
            />
          </div>

          <select
            value={crewName}
            onChange={(e) => setCrewName(e.target.value)}
            className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#9d2449]"
          >
            <option value="바스포드">바스포드</option>
            <option value="철와대">철와대</option>
            <option value="무친대">무친대</option>
            <option value="수니그룹">수니그룹</option>
            <option value="최가네">최가네</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white font-bold text-sm rounded-xl transition cursor-pointer"
          >
            크루 배정 등록
          </button>
        </form>
      </div>

      {/* 등록된 스트리머 목록 테이블 */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#581c33]">
            등록된 수집 대상 스트리머 ({streamers.length}명)
          </h2>
          <span className="text-xs text-zinc-400">1분마다 이 목록의 스트리머를 자동 추적합니다.</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {streamers.map((s) => (
            <div key={s.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-zinc-800">{s.nickname}</span>
                <span className="text-xs text-zinc-400 font-mono">({s.soopId})</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#9d2449]">
                  {s.crewName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(s.id)}
                  className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition ${
                    s.isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
                  }`}
                >
                  {s.isActive ? '수집 활성' : '수집 일시정지'}
                </button>

                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
