/**
 * 스트리머 아바타 정적 파일 경로 및 다단계 폴백 헬퍼
 */

export const DEFAULT_AVATAR_PLACEHOLDER = '/icon.svg';

/**
 * 로컬 정적 CDN 아바타 경로 반환 (/avatars/{soopId}.jpg)
 */
export function getStaticAvatarUrl(soopId: string): string {
  const cleanId = (soopId || '').trim().toLowerCase();
  if (!cleanId) return DEFAULT_AVATAR_PLACEHOLDER;
  return `/avatars/${encodeURIComponent(cleanId)}.jpg`;
}

/**
 * 실시간 Cloudflare Edge 프록시 URL (/api/avatar?id={soopId})
 */
export function getProxyAvatarUrl(soopId: string): string {
  const cleanId = (soopId || '').trim().toLowerCase();
  if (!cleanId) return DEFAULT_AVATAR_PLACEHOLDER;
  return `/api/avatar?id=${encodeURIComponent(cleanId)}`;
}

/**
 * SOOP 원본 CDN 직접 URL
 */
export function getDirectSoopAvatarUrl(soopId: string): string {
  const cleanId = (soopId || '').trim().toLowerCase();
  if (!cleanId) return DEFAULT_AVATAR_PLACEHOLDER;
  return `https://profile.img.sooplive.co.kr/LOGO/${cleanId.slice(0, 2)}/${cleanId}/${cleanId}.jpg`;
}

/**
 * 이미지 로딩 실패 시 자동 3단계 폴백 이벤트 핸들러
 * 1단계: /avatars/{id}.jpg 실패 -> /api/avatar 프록시로 폴백
 * 2단계: /api/avatar 프록시 실패 -> SOOP 원본 직접 URL 또는 profileImageUrl로 폴백
 * 3단계: SOOP 원본 실패 -> 기본 플레이스홀더 아이콘으로 전환 (무한 루프 방지)
 */
export function handleAvatarError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  soopId: string,
  profileImageUrl?: string | null
): void {
  const img = event.currentTarget;
  const cleanId = (soopId || '').trim().toLowerCase();
  const staticPath = `/avatars/${encodeURIComponent(cleanId)}.jpg`;
  const proxyPath = `/api/avatar?id=${encodeURIComponent(cleanId)}`;
  const directPath = profileImageUrl || getDirectSoopAvatarUrl(cleanId);

  // 1단계: 로컬 정적 파일 실패 시
  if (img.src.includes(staticPath)) {
    img.src = proxyPath;
    return;
  }

  // 2단계: 프록시 실패 시
  if (img.src.includes(proxyPath) || img.src.includes('/api/avatar')) {
    img.src = directPath;
    return;
  }

  // 3단계: 최종 실패 시 기본 플레이스홀더로 고정
  if (!img.src.includes(DEFAULT_AVATAR_PLACEHOLDER)) {
    img.src = DEFAULT_AVATAR_PLACEHOLDER;
  }
}
