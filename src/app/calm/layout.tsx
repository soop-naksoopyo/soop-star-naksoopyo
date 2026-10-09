import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '캄몬스타즈 대시보드',
  description: '캄몬스타즈 별풍선 · 방송시간 통계 전용 대시보드',
  icons: {
    icon: [
      { url: '/crests/26.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/crests/26.png', sizes: '192x192' },
    ],
  },
};

export default function CalmmonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
