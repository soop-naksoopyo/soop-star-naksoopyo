# SoopScope 7분 shard 수집

237명을 7개 shard에 33~34명씩 나눕니다. cron-job.org 작업 하나를 매분 실행하면 Edge Function이 다음 shard를 자동 선택해 스트리머별 전체 갱신이 7분마다 돌아옵니다. 별풍선은 SoopScope `monthly-total.canonical`을, 방송시간·시청 지표는 `stats`를 사용합니다. SoopScope에서 조회할 수 없는 스트리머는 대체 수집하지 않습니다. 별풍선 canonical 값은 이전 5-shard 작업이 덮어쓰지 않도록 DB의 `stars_source`로 보존합니다.

## 배포

1. DB 마이그레이션 적용: `supabase db push`.
2. 기존 `SOOPSCOPE_CRON_SECRET` 또는 호환용 `POONGGO_CRON_SECRET`을 유지합니다.
3. Edge Function 배포: `supabase functions deploy poonggo-sync --project-ref <PROJECT_REF>`.
4. Cloudflare Pages를 빌드·배포합니다.

마이그레이션에는 237명 10월 roster, snapshot·수집 상태 테이블, 7-shard 로그 스키마가 포함됩니다. 기존 5-shard 요청은 새 7-shard 작업이 시작되면 자동으로 건너뜁니다.

## cron-job.org 작업

새 작업 1개를 만듭니다.

- 제목: `SOOP 랭킹 SoopScope 수집 (7분 순환)`
- 실행: 매분, 시간대 `Asia/Seoul`
- URL: `https://<PROJECT_REF>.supabase.co/functions/v1/poonggo-sync?shard=auto`
- 메서드: `POST`
- 헤더: `Authorization: Bearer <기존 secret>`
- 본문: 비움
- 제한시간: 30초

코드 배포 후 이 작업을 테스트 실행합니다. 200 응답과 상태 API의 `expectedShards=7`을 확인한 뒤 기존 5개 작업을 비활성화합니다. `soopscope_sync_status`에서 shard 완료 수와 실패 수를 확인할 수 있습니다. 34명에 대한 API 시험은 68건 모두 성공했고 약 11초 걸렸습니다.
