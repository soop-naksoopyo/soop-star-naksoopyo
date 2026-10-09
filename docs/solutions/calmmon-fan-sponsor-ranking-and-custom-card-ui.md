# 캄몬스타즈 큰손 후원 랭킹(시청자 별풍선/계정/아바타) 개편 및 카드 요약 분리

## 1. 개요 및 배경
- **문제점 / 요구사항**:
  - 기존 캄몬스타즈 대시보드의 `👑 후원 랭킹` 탭이 "준비중" 뱃지 상태였으며, 기존 구조상 스트리머 기준으로 보여주는 것은 첫 번째 탭인 `🎈 별풍선` 탭(스트리머 17명이 받은 별풍선 수치)과 기능이 중복되는 한계가 있었음.
  - 사용자의 기획 제안:
    1. 스트리머 기준 랭킹이 아닌 **실제 시청자(큰손/후원자) 기준 랭킹**(순위, 닉네임, 계정 ID, 아바타, 후원 별풍선 개수, 주 후원 멤버)으로 전환.
    2. 후원 랭킹 탭에서는 하단 3개 요약 카드(전체 합계, 여자 평균, 전체 평균) 및 스트리머 기준 범례를 제외하여 깔끔한 와이드 리스트로 제공.
  - 추가 문의: 와이고수 자동 포스팅 계정 변경 시 GitHub Secret(`YGOSU_ID`, `YGOSU_PW`)만 변경하면 되는지 확인.

---

## 2. 해결 방안 및 아키텍처

### 2.1 하이브리드 데이터 파이프라인 (`scripts/sync-calmmon-donors.mjs`)
1. **SOOP 공식 방송국 API (`chapi.sooplive.co.kr/api/${soopId}/station`)**:
   - 캄몬스타즈 17명 방송국의 상위 열혈팬 목록(`starballoon_top`)을 조회하여 후보 후원자 159명의 ID, 닉네임, 공식 프로필 이미지 URL(`//profile.img.sooplive.co.kr/...`)을 1차 수집.
2. **Trackify BigSpender API (`ranking/bigspender?period=monthly&q=${userId}`)**:
   - 후보 후원자들의 월간 후원 내역 및 캄몬 멤버 전용 후원 별풍선 수량, 기여도 높은 주 후원 멤버를 정확히 매칭.
3. **데이터 캐싱 (`src/data/calmmonDonors.json`)**:
   - 수집된 TOP 20 후원자를 월별 키(`2026-10`, `2026-09`)로 저장.
   - GitHub Actions 크롤러(`.github/workflows/sync-soopscope.yml`)에 10분 주기 동기화 추가.
   - 월간 마감(`scripts/archive-monthly.mjs`) 시 해당 월 후원자 데이터 자동 동결.

### 2.2 UI & UX 개편 (`CalmmonCard.tsx`, `calm/page.tsx`)
1. **탭 활성화**:
   - `👑 후원 랭킹` 탭의 "준비중" 뱃지 제거 및 핫핑크 테마 버튼 활성화.
2. **단일 와이드 랭킹 리스트 렌더링**:
   - `currentTab === 'donor'`일 때 기존 남/여 2열 테이블 대신 시청자 랭킹 리스트로 동적 전환.
   - 1위(골드 👑), 2위(실버 🥈), 3위(브론즈 🥉) 하이라이트 배경 및 뱃지 적용.
   - 프로필 아바타: 고화질 원형 아바타 + 이미지 미등록 계정은 닉네임 첫 글자 이니셜 뱃지로 세련된 fallback 처리.
   - 계정 ID 링크: 클릭 시 해당 시청자의 SOOP 채널로 새 창 이동.
   - 주 후원 멤버 태그: `주후원: {primaryStreamer}` 뱃지 표시.
3. **하단 요약 카드 및 범례 제외**:
   - `currentTab !== 'donor'`일 때만 스트리머 전체 합계, 여자 평균, 전체 평균 및 ON 뱃지 범례 표시.
   - `currentTab === 'donor'`일 때는 하단에 깔끔한 후원 랭킹 안내 문구만 노출.

---

## 3. 검증 결과
- **테스트 및 빌드**:
  - `vitest`: 15개 테스트 스위트, 57개 단위 테스트 전체 통과 (0 regression).
  - Next-on-Pages 빌드: Cloudflare Pages 번들 1198 KiB 최적화 완료.
- **프로덕션 배포**:
  - `https://soop-star-naksoopyo.pages.dev/calm` 배포 완료.
- **Playwright 시각 검증**:
  - `calm_donor_live_mobile.png`, `calm_donor_live_desktop.png`로 모바일/데스크톱 렌더링 및 하단 합계 카드 미노출 정상 검증 완료.
