# 경량 SCM 시스템 계획서 (MVP 실행 계획)

## 1. 프로젝트 범위
### 포함
- 품목/BOM/재고/생산계획 입력 화면
- 대시보드 자동 계산 및 시각화
- Vercel 배포 및 API 연결 가이드

### 제외(후속)
- MOQ/리드타임 고도화
- 자동 발주서 생성 고도화
- 다창고 고급 운영 UI

## 2. 아키텍처
- Frontend: Next.js(App Router) + TypeScript + Tailwind + Recharts
- Backend: FastAPI + SQLAlchemy
- 배포: Vercel(프론트), 공개 백엔드(Render/Railway 등)

## 3. 데이터베이스/도메인 요약
- item(PRODUCT/RAW, unit_price)
- bom(parent_item_id, child_item_id, qty_per)
- inventory(item_id, warehouse_id, qty, as_of_date)
- production_plan(item_id, period_start, period_end, quantity)

## 4. API 설계 (실사용)
- GET/POST `/api/items`
- GET/POST `/api/boms`
- GET/POST `/api/inventories`
- GET/POST `/api/production-plans`
- GET `/api/dashboard`
- POST `/api/calculate`

## 5. 데이터 흐름
- 입력 UI → API 저장 → DB 반영
- 대시보드 조회 시 DB 기반 계산 결과 반환
- 생산계획 자동반영 ON 시 기간 겹침 합계를 예상생산량에 적용

## 6. 단계별 구현 계획
### Phase A (완료)
- 기본 메뉴/페이지, CRUD, 계산 API 구현

### Phase B (진행)
- 재고 입력 단순화(창고 자동 MAIN)
- 네트워크 실패 메시지 개선
- 문서 최신화

### Phase C (다음)
- 배포환경 E2E 테스트 자동화
- 운영 모니터링 및 알림 설정

## 7. 리스크/대응
| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| NEXT_PUBLIC_API_URL 누락 | 높음 | 배포 문서 + UI 안내 |
| 저장소/브랜치 혼선 | 높음 | Vercel Git 연결 재검증 |
| 초기 데이터 누락 | 중간 | 온보딩 체크리스트 제공 |

## 8. 테스트 계획
- 단위: 계산 함수(period, 부족량, 발주량)
- 통합: 품목→BOM→재고→대시보드
- 배포: Vercel 실도메인에서 등록/조회 확인

## 9. 배포 계획
1) main push
2) Vercel build/deploy
3) env/cors 점검
4) smoke test

## 10. DoD
- [ ] 배포 사이트에서 핵심 입력/조회 가능
- [ ] Failed to fetch 대신 원인 안내 표시
- [ ] 문서 4종 최신 상태 유지
