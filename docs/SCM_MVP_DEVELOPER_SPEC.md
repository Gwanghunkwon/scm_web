# SCM MVP 기능 + 작동 로직 전체 정의 (개발자 전달용)

> 본 문서는 제품/배합비/재고/생산계획 입력 → 자동 발주 산출 → 대시보드 시각화까지의 **MVP 범위**를 정의한다.  
> **현재 저장소 구현과의 매핑**은 하단 「구현 매핑」을 참고한다.

## 목표

- 배합비(BOM) + 재고 기반
- 기간 선택 → 자동 발주 계획 생성
- 대시보드에서 직관적으로 확인

---

## 1️⃣ 전체 시스템 구조

**[입력]**

- 제품
- 배합비 (BOM)
- 재고
- 생산/판매 계획

        ↓

**[계산 엔진]**

- 필요 원재료 계산
- 부족량 계산
- 발주량 산출

        ↓

**[출력]**

- 대시보드
- 그래프
- 발주 리스트

---

## 2️⃣ 핵심 기능 정의

### 📦 1. 제품(Product) 관리

- 제품 등록 / 수정 / 삭제
- 제품별 기준 생산 단위 설정

**필드 (논리)**  
`id`, `name`, `unit` (예: 1개, 1kg)

**DB 매핑**  
`item` 테이블, `type = 'PRODUCT'`, `uom` = unit, `code` = 고유 코드(내부 식별)

### 🧪 2. 배합비(BOM) 관리

- 제품별 원재료 구성 정의
- 엑셀 업로드 (필수, MVP는 프론트에서 `.xlsx` 파싱 후 API 다건 등록)

**구조**  
`product_id`, `material_id`, `quantity_per_unit` (제품 1단위당 소요량)

**API 매핑**  
`POST /api/boms` (parent_item_id, child_item_id, qty_per)

### 📦 3. 원재료(Material) 관리

- 원재료 등록, 단위 설정, 단가 입력(선택)

**필드**  
`id`, `name`, `unit`, `price`(optional)

**DB 매핑**  
`item` 테이블 `type = 'RAW'`, `unit_price`(optional)

### 📊 4. 재고(Inventory) 관리

- 현재 재고 입력 / 수정 (입출고 이력은 선택, 기존 `stock_transaction` API 활용 가능)

**필드**  
`material_id`, `current_stock`, `last_updated`

**DB 매핑**  
`inventory` (item_id, warehouse_id, qty, as_of_date) — 동일 키면 `POST` 시 수량 갱신(upsert)

### 📈 5. 생산/판매 계획 입력

- 기간별 생산량 입력

**입력**  
`product_id`, `period` (3m/6m/12m), `planned_quantity`

**DB/API**  
`production_plan` + `POST /api/production-plans`  
대시보드/계산은 `POST /api/calculate` 또는 `GET /api/dashboard`로 집계

---

## 3️⃣ 핵심 계산 로직

1. **총 필요 원재료**  
   `총 필요량 = Σ (제품 생산량 × 배합비)` — 다제품이면 BOM 전개 결과를 원재료별 합산

2. **현재 재고 반영**  
   재고 없음 → **0**  
   `부족 표시값 = 현재 재고 - 필요량` (음수면 발주 필요 의미로 표현 가능)

3. **발주 필요량**  
   `발주량 = max(필요량 - 현재 재고, 0)`

4. **기간별 분할**  
   `월 소비량 = 총 필요량 / 기간 개월 수`  
   누적 발주 추이는 월별 누적 필요 대비 재고로 라인 차트 생성

5. **발주 시점 (선택)**  
   향후: `재고 < 다음달 필요량` 등 규칙 추가

6. **비용 (선택)**  
   `발주 비용 = Σ(발주량 × 단가)` — 원재료 `unit_price` 있을 때 KPI에 반영

---

## 4️⃣ 데이터 흐름 (API 기준)

### 데이터 조회 (현재 구현)

| 스펙 | 실제 엔드포인트 |
|------|-----------------|
| GET /products | `GET /api/items` + `type=PRODUCT` 필터(클라이언트) |
| GET /materials | `GET /api/items` + `type=RAW` |
| GET /bom | `GET /api/boms` |
| GET /inventory | `GET /api/inventories` |
| GET /production-plan | `GET /api/production-plans` |

### 계산 실행

**`POST /api/calculate`**

요청 예:

```json
{
  "period": "3m",
  "production_plan": [
    { "product_id": 1, "planned_quantity": 100 }
  ]
}
```

응답 예:

```json
{
  "period": "3M",
  "materials": [
    {
      "material_id": "12",
      "name": "설탕",
      "required": 100,
      "stock": 30,
      "shortage": 70,
      "order": 70,
      "unit": "kg"
    }
  ],
  "kpis": { ... },
  "stock_vs_required": [ ... ],
  "forecast": [ ... ]
}
```

- **구현**: `backend/services/scm_calculation.py`의 `compute_dashboard_for_plans` — `GET /api/dashboard`와 동일 엔진.
- **다제품**: `production_plan`에 여러 `product_id`를 넣으면 BOM 전개 후 원재료별 수량이 합산된다.

대시보드 UI는 기존처럼 **`GET /api/dashboard`**(단일 제품 + 생산량)도 사용 가능.

---

## 5️⃣ 대시보드 출력 데이터

- KPI: 총 부족 원재료 수, 총 발주 필요량, 총 발주 비용(단가 있을 때), 가장 부족한 원재료
- 막대: 재고 vs 필요량
- 라인: 기간별(누적) 발주 필요량
- 테이블: 부족/권장 발주 리스트

---

## 6️⃣ 사용자 시나리오

1. 제품 등록  
2. 배합비 엑셀 업로드  
3. 원재료 등록  
4. 재고 입력  
5. 생산 계획 입력  
6. 기간 선택 (3/6/12개월)  
7. 자동 계산 실행 (`POST /api/calculate` 또는 대시보드)  
8. 대시보드 확인  

---

## 7️⃣ 예외 처리 (필수)

| 상황 | 처리 |
|------|------|
| 재고 없음 | 재고 0 |
| BOM 없는 제품 | 해당 제품은 계산에서 제외(또는 빈 결과) |
| 단위 불일치 (g↔kg) | MVP: 사용자가 동일 단위로 입력. 확장 시 변환 테이블 |
| 음수 발주 | `max(..., 0)` |

---

## 8️⃣ 성능

- MVP: 데이터 규모 작음 → 서버 계산으로 충분  
- 확장: 캐싱, 배치 MRP

---

## 9️⃣ 확장 기능

MOQ, 리드타임, 자동 발주서, 공급업체, 알림 등

---

## 🚀 한 줄 요약

> **지금 재고로 부족한 원재료를 자동으로 계산하고, 얼마나 발주해야 하는지 보여주는 시스템**
