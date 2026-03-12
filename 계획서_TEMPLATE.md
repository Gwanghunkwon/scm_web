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
[프론트엔드 SPA (React/Vue + Vite)]
    ↓ (HTTPS, REST API)
[백엔드 API 서버 (Node.js/NestJS 또는 Spring Boot)]
    ↓
[RDBMS (PostgreSQL/MySQL)]

※ (선택) 인증/SSO, 알림(메일/Slack 등) 외부 서비스 연동
```

### 2.2 기술 스택
- **프론트엔드**: React 또는 Vue + TypeScript, Vite, UI 라이브러리(Ant Design/MUI 등)
- **백엔드**: Node.js(Express/NestJS) 또는 Spring Boot(Java/Kotlin) 기반 REST API
- **데이터베이스**: PostgreSQL 또는 MySQL
- **인프라**: 클라우드(AWS EC2 + RDS 등) 또는 온프레미스, 정적 프론트는 Vercel/Netlify 등도 가능

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
### 4.1 API 엔드포인트 목록
- `GET /api/v1/[리소스]` - [설명]
- `POST /api/v1/[리소스]` - [설명]
- `PUT /api/v1/[리소스]/{id}` - [설명]
- `DELETE /api/v1/[리소스]/{id}` - [설명]

### 4.2 주요 API 상세
#### API 1: [API명]
- **엔드포인트**: `[HTTP 메서드] /api/v1/[경로]`
- **요청**: 
  ```json
  {
    "field1": "value1",
    "field2": "value2"
  }
  ```
- **응답**:
  ```json
  {
    "status": "success",
    "data": {}
  }
  ```
- **에러 처리**: [에러 케이스 및 응답]

## 5. 데이터 흐름
### 5.1 주요 플로우
1. [단계 1]
2. [단계 2]
3. [단계 3]
4. [단계 4]

### 5.2 상태 전이
```
[상태 1] -> [이벤트] -> [상태 2]
[상태 2] -> [이벤트] -> [상태 3]
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
