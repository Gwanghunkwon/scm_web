# 경량 SCM 시스템 계획서

## 1. 프로젝트 범위
### 1.1 포함 범위
- 재고, 생산, 자재, 발주, 수요예측을 한 웹 사이트에서 통합 관리
- 품목/재고/BOM/리드타임/수요예측/생산계획/발주 기초 데이터 관리
- 수요예측 → 생산계획 → BOM 계산 → 자재 소요 계획(MRP) → 발주 → 재고/입출고 → 납품 플로우

### 1.2 제외 범위
- 상세 APS·MES, ERP 회계/원가, 물류 최적화, 모바일 앱(초기 버전)

## 2. 아키텍처 설계
### 2.1 시스템 아키텍처
```
[사용자 브라우저]
    ↓
[프론트엔드 SPA (React + Vite, Vercel 배포)]
    ↓  (HTTPS, REST API)
[백엔드 API 서버 (FastAPI, Render/Railway/AWS)]
    ↓
[PostgreSQL (Supabase/Render DB)]
    ↓
[파일 스토리지 (Cloudflare R2 / S3)]

※ 인증/SSO, 알림(메일/Slack 등)은 향후 연동 대상
```

### 2.2 기술 스택
- **프론트엔드**: React + TypeScript, Vite, UI 라이브러리(Ant Design/MUI 등)
- **백엔드**: Python FastAPI + Uvicorn (도메인별 Router 구성)
- **데이터베이스**: PostgreSQL (Supabase/Render DB 등 매니지드 서비스)
- **스토리지**: Cloudflare R2 또는 AWS S3 (엑셀/파일 업로드용)
- **인프라**: 프론트는 Vercel(무료 플랜), 백엔드는 Render/Railway, 필요 시 AWS EC2로 확장

### 2.3 폴더 구조
```
SCM/
├── frontend/              # React/Vite 기반 웹 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── master/        # 품목/BOM/리드타임
│   │   │   ├── demand/        # 수요예측
│   │   │   ├── production/    # 생산계획
│   │   │   ├── mrp/           # 소요량/MRP
│   │   │   ├── purchase/      # 발주
│   │   │   └── inventory/     # 재고/입출고
│   │   └── hooks/
│   └── public/
├── backend/               # API 서버 (추가 예정)
│   ├── src/
│   └── test/
└── docs/                  # 기획/계획/체크리스트 등
    ├── PLAN.md
    ├── CONTEXT.md
    └── CHECKLIST.md
```

## 3. 데이터베이스 설계
### 3.1 테이블 구조
- **item (품목)**
  - `id`: PK
  - `code`: 품목코드 (Unique)
  - `name`: 품목명
  - `type`: 제품/원자재
  - `uom`: 단위
  - `default_warehouse_id`: 기본 창고 FK
  - `safety_stock_qty`: 안전재고
  - `lead_time_days`: 기본 리드타임(일)
  - `active`: 사용 여부

- **warehouse (창고)**
  - `id`: PK
  - `code`, `name`

- **inventory (재고)**
  - `id`: PK
  - `item_id`, `warehouse_id`
  - `qty`
  - `as_of_date`

- **user (사용자)**
  - `id`: PK
  - `email`: 로그인 이메일 (Unique)
  - `password_hash`: 암호화된 비밀번호
  - `name`: 이름
  - `role`: 역할(ADMIN/PLANNER/BUYER/INVENTORY/VIEWER 등)
  - `is_active`: 활성 여부
  - `created_at`, `updated_at`

- **bom (BOM)**
  - `id`: PK
  - `parent_item_id`: 상위 제품
  - `child_item_id`: 하위 자재
  - `qty_per`: 상위 1단위당 소요수량
  - `valid_from`, `valid_to`

- **demand_forecast (수요예측)**
  - `id`: PK
  - `item_id`
  - `period_start`, `period_end`
  - `quantity`
  - `method`

- **production_plan (생산계획)**
  - `id`: PK
  - `item_id`
  - `period_start`, `period_end`
  - `quantity`
  - `status`
  - `version`

### 3.2 관계
- item 1:N inventory, 1:N bom, 1:N demand_forecast, 1:N production_plan
- warehouse 1:N inventory

## 4. API 설계
### 4.1 API 엔드포인트 목록 (예시)
- 인증/사용자
  - `POST /api/auth/register` (회원가입)
  - `POST /api/auth/login` (로그인, JWT 토큰 발급)
  - `GET /api/auth/me` (내 정보 조회)
- 품목/기초데이터
  - `GET /api/items`, `POST /api/items`, `PUT /api/items/{id}`
  - `GET /api/warehouses`
  - `GET /api/boms`, `POST /api/boms`
- 수요/생산
  - `GET /api/demand-forecasts`, `POST /api/demand-forecasts/bulk`
  - `GET /api/production-plans`, `POST /api/production-plans`
  - `POST /api/production-plans/from-forecast`
- 재고/입출고
  - `GET /api/inventories`
  - `GET /api/stock-transactions`, `POST /api/stock-transactions`
- 소요량/MRP
  - `POST /api/mrp/run`
  - `GET /api/mrp/results`
- 발주/입고
  - `GET /api/purchase-orders`, `POST /api/purchase-orders`
  - `POST /api/purchase-orders/{id}/receive`

### 4.2 주요 API 상세 (예: MRP 실행)
- **엔드포인트**: `POST /api/mrp/run`
- **요청**:
  ```json
  {
    "planPeriodStart": "2026-04-01",
    "planPeriodEnd": "2026-04-30",
    "includeSafetyStock": true
  }
  ```
- **응답**:
  ```json
  {
    "status": "success",
    "generatedCount": 120
  }
  ```
- **에러 처리**: 생산계획 없음, BOM/리드타임 누락, DB 오류 등 상황별 에러 코드·메시지 정의

## 5. 데이터 흐름
### 5.1 주요 플로우 (재고 조회 예시)
1. 사용자가 웹에서 재고 현황 화면을 요청한다.
2. Frontend에서 `GET /api/inventories` 를 호출한다.
3. FastAPI 서버가 PostgreSQL에서 재고·입출고 데이터를 조회하고 집계한다.
4. JSON 형태로 응답을 반환하고, Frontend에서 테이블·카드 형태로 표시한다.

### 5.2 상태 전이 (예시)
```
[생산계획: 임시]  --확정-->  [생산계획: 확정]
[발주: 요청]      --발주-->  [발주: 발주]
[발주: 발주]      --입고-->  [발주: 입고완료]
```

## 6. 단계별 구현 계획
### Phase 1: [단계명]
- **기간**: [예상 기간]
- **목표**: [목표]
- **작업 항목**:
  - [ ] [작업 1]
  - [ ] [작업 2]
  - [ ] [작업 3]
- **완료 기준**: [완료 기준]

### Phase 2: [단계명]
- **기간**: [예상 기간]
- **목표**: [목표]
- **작업 항목**:
  - [ ] [작업 1]
  - [ ] [작업 2]
  - [ ] [작업 3]
- **완료 기준**: [완료 기준]

### Phase 3: [단계명]
- **기간**: [예상 기간]
- **목표**: [목표]
- **작업 항목**:
  - [ ] [작업 1]
  - [ ] [작업 2]
  - [ ] [작업 3]
- **완료 기준**: [완료 기준]

## 7. 필요한 리소스
### 7.1 개발 환경
- [환경/도구 1]
- [환경/도구 2]

### 7.2 외부 서비스/계정
- [서비스/계정 1]: [용도]
- [서비스/계정 2]: [용도]

### 7.3 인프라
- [인프라 리소스 1]
- [인프라 리소스 2]

## 8. 리스크 및 대응 방안
| 리스크 | 영향도 | 확률 | 대응 방안 |
| --- | --- | --- | --- |
| [리스크 1] | High/Medium/Low | High/Medium/Low | [대응 방안] |
| [리스크 2] | High/Medium/Low | High/Medium/Low | [대응 방안] |

## 9. 테스트 계획
### 9.1 단위 테스트
- [테스트 대상 1]
- [테스트 대상 2]

### 9.2 통합 테스트
- [테스트 시나리오 1]
- [테스트 시나리오 2]

### 9.3 E2E 테스트
- [테스트 시나리오 1]
- [테스트 시나리오 2]

## 10. 배포 계획
### 10.1 배포 단계
1. [단계 1]
2. [단계 2]
3. [단계 3]

### 10.2 롤백 계획
- [롤백 조건]
- [롤백 절차]

## 11. 완료 기준 (Definition of Done)
- [ ] [기준 1]
- [ ] [기준 2]
- [ ] [기준 3]
- [ ] [기준 4]
