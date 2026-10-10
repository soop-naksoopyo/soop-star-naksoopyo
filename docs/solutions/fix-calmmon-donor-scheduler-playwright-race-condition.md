# 캄몬스타즈 후원 랭킹 자동 스케줄러 Playwright 빈 화면 캡처 버그 원인 분석 및 해결

## 1. 개요 및 장애 현상
- **발생 시각**: 2026-10-10 19:04 KST (GitHub Actions `Daily Calmmon Donor Post (Star Prison 19:00 KST)` 실행)
- **장애 증상**:
  - 스케줄러 자체는 성공(`[ok]`)으로 완료되고 와이고수 스타감옥 게시판에 `[10/10 19시 기준] 캄몬스타즈 큰손 후원 랭킹 TOP 100 (1~100위)` 제목으로 글이 정상 등록됨.
  - 하지만 첨부된 5장의 캡처 이미지 모두 **`후원자 데이터가 없습니다.` (1/1P)** 상태로 빈 카드가 촬영되어 업로드됨.

---

## 2. 근본 원인 분석 (Root Cause Analysis)

### 2.1 클라이언트 사이드 비동기 데이터 로딩 지연 (Race Condition)
1. **Next.js CSR 지연**:
   - `/calm` 페이지(`src/app/calm/page.tsx`)는 `'use client'` 기반 컴포넌트로, 컴포넌트 마운트 후 `useEffect` 내부에서 `fetch('/api/calmmon?month=2026-10')`을 비동기 호출함.
   - `/api/calmmon` 엔드포인트는 Trackify 실시간 랭킹 API를 조회(타임아웃 6초)하므로 원격 서버 간 지연시간(1~3초)이 발생함.
2. **초기 상태(useState)의 빈 배열(`[]`) 할당**:
   - 기존 `src/app/calm/page.tsx`에서 `donors` 상태가 `useState<CalmmonDonorRow[]>([])`로 빈 배열로 시작됨.
   - 따라서 첫 렌더링 시에는 API 응답이 도착하기 전까지 무조건 `top100Donors.length === 0`이 되어 `<div className="...">후원자 데이터가 없습니다.</div>`가 노출됨.
3. **Playwright 캡처 스크립트의 성급한 스크린샷 (`scripts/capture_calmmon_donors.js`)**:
   - 스크립트가 `page.goto(..., { waitUntil: 'domcontentloaded' })` 직후 `button:has-text("후원 랭킹")`을 클릭하고 불과 **600ms(`waitForTimeout(600)`)**만 대기함.
   - GitHub Actions 해외 러너 환경에서 네트워크 왕복 지연으로 인해 600ms 시점에는 `/api/calmmon` 응답이 도착하지 않아 React 상태가 여전히 빈 배열이었음.
   - 데이터가 없으니 `totalDonorPages`가 1로 계산되어 페이지 버튼(`button:text-is("2")` ~ `5`)이 아예 존재하지 않았음.
   - 결과적으로 2~5페이지 버튼 클릭 로직이 스킵되면서 0.3초 만에 1페이지의 빈 카드만 5번 연속 캡처되는 치명적 타이밍 이슈가 발생함.

---

## 3. 해결 방안 및 수정 내역

### 3.1 번들된 로컬 데이터로 초기 상태 즉시 바인딩 (`src/app/calm/page.tsx`)
- 이미 프로젝트 내부에 최신 동기화된 `src/data/calmmonDonors.json`이 존재함.
- `donors` 상태 초기값을 빈 배열이 아닌 로컬 JSON 데이터로 초기화하여, 첫 번째 렌더링 및 SSR 시점부터 후원자 100명이 즉시 화면에 렌더링되도록 개선:
  ```typescript
  import calmmonDonors from '@/data/calmmonDonors.json';
  ...
  const [donors, setDonors] = useState<CalmmonDonorRow[]>(
    () => (calmmonDonors as Record<string, CalmmonDonorRow[]>)[selectedMonth] || []
  );
  ```

### 3.2 Playwright 캡처 스크립트 대기 조건 강화 (`scripts/capture_calmmon_donors.js`)
- 임의의 `waitForTimeout(600)` 방식을 완전히 제거.
- **2중 조건 대기(`page.waitForFunction`) 도입**:
  1. 본문에 `후원자 데이터가 없습니다.` 문구가 완전히 사라졌는지 검증.
  2. 100명이 정상 로드되어 페이지네이션 버튼 중 `'5'`번 버튼이 DOM에 렌더링되었는지 확인.
- 각 페이지 번호 클릭 시에도 `button:text-is("${p.pageNum}")`이 `visible` 상태가 될 때까지 명시적으로 대기하도록 보강:
  ```javascript
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    const hasEmptyMsg = text.includes('후원자 데이터가 없습니다.');
    const pageButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    const hasPage5 = pageButtons.includes('5');
    return !hasEmptyMsg && hasPage5;
  }, { timeout: 25000 });
  ```

### 3.3 보조 스크립트 방어 로직 추가
- `scripts/capture_calmmon.js`: 4번 탭(후원 랭킹) 캡처 시에도 `후원자 데이터가 없습니다.`가 사라질 때까지 대기하는 가드 로직 적용.
- `scripts/ygosu_post.py`: 이미지 업로드 로그에 하드코딩된 '4장' 대신 `len(valid_images)`를 반영하여 정확한 수량(5장)이 로깅되도록 수정.

---

## 4. 검증 결과
1. **로컬 실행 검증**:
   - `node scripts/capture_calmmon_donors.js "https://soop-star-naksoopyo.pages.dev"` 재실행 결과, 데이터 렌더링 대기 통과 후 1~5페이지(1~20위, 21~40위, 41~60위, 61~80위, 81~100위)가 정상 캡처됨.
   - `view_file`로 실제 캡처된 `01_donor_01_20.png` 및 `02_donor_21_40.png`를 확인하여 1위 Fresh제리(69,439개)부터 정상 표기 확인.
2. **Next.js 프로덕션 빌드 및 테스트 통과**:
   - `npm run build`: 성공 (Cloudflare Next-on-Pages 빌드 정상 완료).
   - `npm test`: 15개 테스트 스위트 / 57개 테스트 전체 통과.
3. **원격 저장소 동기화**:
   - 변경사항 커밋 및 `origin/main` 푸시 완료 (`fix(capture): wait for calmmon donor data before taking screenshots`).
