# 경량 SCM 시스템 구현 체크리스트 (MVP)

## 현재 상태
- 프로젝트명: SCM MVP
- 마지막 업데이트: 2026-03-11
- 현재 마일스톤: 배포 안정화 + 입력 플로우 단순화

## 진행 체크리스트

### 1) 기획/설계
- [x] MVP 범위 확정 (품목/BOM/재고/생산계획/대시보드)
- [x] 계산 로직(필요/부족/발주) 정의
- [x] Vercel 배포 가이드 문서화

### 2) 프론트엔드
- [x] 대시보드/품목/BOM/재고/생산계획 페이지
- [x] BOM 엑셀 업로드
- [x] API 실패 시 사용자 안내 메시지
- [x] 재고 입력 단순화(창고 선택 제거, MAIN 자동)
- [ ] 다제품 계산(`POST /api/calculate`) 전용 화면 추가

### 3) 백엔드
- [x] 품목/BOM/재고/생산계획 CRUD API
- [x] 대시보드 계산 API
- [x] POST `/api/calculate` 구현
- [x] `item.unit_price` 반영
- [ ] 운영 DB 마이그레이션(Alembic) 정식화

### 4) 배포/운영
- [x] Vercel 최신 커밋 배포 확인
- [ ] `NEXT_PUBLIC_API_URL` Production/Preview 설정 확인
- [ ] 백엔드 CORS에 배포 도메인 최종 반영 확인
- [ ] 배포 smoke test 문서화

### 5) 테스트
- [ ] 품목 등록 → 목록 반영
- [ ] BOM 업로드 → 목록 반영
- [ ] 재고 등록 → 대시보드 재계산 반영
- [ ] 생산계획 자동반영 ON/OFF 검증

## 이슈 트래킹
| 우선순위 | 이슈 | 상태 | 비고 |
| --- | --- | --- | --- |
| Critical | 배포 환경변수 누락 시 API 실패 | In Progress | Vercel env 설정 필요 |
| High | 백엔드 공개 URL 고정 필요 | Open | Render/Railway 주소 확정 |
| Medium | calculate 전용 UI 미제공 | Open | 후속 페이지 추가 |

## 다음 액션
1. Vercel `NEXT_PUBLIC_API_URL` 적용 후 재배포
2. 배포 도메인에서 품목/재고 저장 확인
3. 대시보드 값 갱신 E2E 확인
