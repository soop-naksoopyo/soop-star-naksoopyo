import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: '기존 숲스코프 수집은 종료되었습니다. 풍고 수집 작업으로 데이터를 갱신하세요.',
    },
    { status: 410 }
  );
}
