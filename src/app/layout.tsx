import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOOP 스타크루 대시보드',
  description: 'SOOP 스타크루 별풍선 · 뷰어십 순위와 방송 통계 대시보드',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '192x192' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="bg-[#f8fafc]">
      <body className="min-h-screen antialiased bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
