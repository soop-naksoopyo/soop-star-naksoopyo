import { describe, it, expect } from 'vitest';
import {
  getStaticAvatarUrl,
  getProxyAvatarUrl,
  getDirectSoopAvatarUrl,
  handleAvatarError,
  DEFAULT_AVATAR_PLACEHOLDER,
} from './avatar';

describe('avatar utility', () => {
  it('generates correct static avatar URL', () => {
    expect(getStaticAvatarUrl('brainzerg7')).toBe('/avatars/brainzerg7.jpg');
    expect(getStaticAvatarUrl('JAM0NG')).toBe('/avatars/jam0ng.jpg');
    expect(getStaticAvatarUrl('')).toBe(DEFAULT_AVATAR_PLACEHOLDER);
  });

  it('generates correct proxy avatar URL', () => {
    expect(getProxyAvatarUrl('brainzerg7')).toBe('/api/avatar?id=brainzerg7');
    expect(getProxyAvatarUrl('')).toBe(DEFAULT_AVATAR_PLACEHOLDER);
  });

  it('generates correct direct SOOP avatar URL', () => {
    expect(getDirectSoopAvatarUrl('brainzerg7')).toBe(
      'https://profile.img.sooplive.co.kr/LOGO/br/brainzerg7/brainzerg7.jpg'
    );
  });

  it('progresses through fallback stages on error', () => {
    const mockImg = {
      src: 'https://example.com/avatars/jam0ng.jpg',
    } as HTMLImageElement;

    const mockEvent = {
      currentTarget: mockImg,
    } as unknown as React.SyntheticEvent<HTMLImageElement, Event>;

    // Stage 1 -> fallback to proxy
    handleAvatarError(mockEvent, 'jam0ng');
    expect(mockImg.src).toBe('/api/avatar?id=jam0ng');

    // Stage 2 -> fallback to direct
    handleAvatarError(mockEvent, 'jam0ng', 'https://custom.img/jam0ng.jpg');
    expect(mockImg.src).toBe('https://custom.img/jam0ng.jpg');

    // Stage 3 -> fallback to default placeholder
    handleAvatarError(mockEvent, 'jam0ng');
    expect(mockImg.src).toBe(DEFAULT_AVATAR_PLACEHOLDER);
  });
});
