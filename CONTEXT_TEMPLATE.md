# CONTEXT

## 시스템 구성
- 프론트엔드: `SCM/frontend` (React + TypeScript + Vite, 정적 호스팅 가능)
- 백엔드(API 서버): `SCM/backend` (Node.js/NestJS 또는 Spring Boot 예정)
- 데이터베이스: PostgreSQL 또는 MySQL (On-prem 또는 클라우드 RDS)
- 기타 인프라:
  - 개발/테스트 환경: 로컬 + 간단한 테스트 DB
  - 운영 환경: 클라우드(예: AWS EC2 + RDS) 또는 내부 서버

## 핵심 아키텍처 흐름
- 사용자/클라이언트(브라우저)
  → 프론트엔드 SPA(React/Vite, Vercel/정적 호스팅 가능)
  → API 서버(HTTPS REST API)
  → 데이터베이스(RDBMS)
- 예시 기능 경로(수요예측 저장):
  - `frontend/src/pages/demand/*` (화면)
  - → `POST /api/demand-forecasts`
  - → `backend/src/modules/demand-forecast/*` (서비스·리포지토리)
  - → RDB 저장

## 핵심 의사결정 기록 (ADR)
### 결정 001 – 경량 SCM 범위 정의
- 날짜: 2026-03-11
- 주제: 초기에 포함할 SCM 기능 범위
- 결정 내용: 수요예측, 생산계획, BOM, 재고, MRP, 발주까지를 1차 범위로, 회계/원가/물류 최적화는 제외
- 이유: 빠른 도입과 사용자 프로세스 정착을 우선, 복잡도·개발 비용을 줄이기 위해
- 대안: ERP 수준까지 한 번에 구현
- 영향 범위: 데이터 모델, 화면 수, 일정 및 리스크 수준

### 결정 002 – 기술 스택 방향
- 날짜: 2026-03-11
- 주제: UI/서버/DB 기술 스택
- 결정 내용: 프론트는 React + Vite, 백엔드는 Node.js(NestJS) 또는 Spring Boot, DB는 PostgreSQL/MySQL 사용
- 이유: 생태계/라이브러리 풍부, 학습 비용 낮고 클라우드 호환성이 높음
- 대안: 전체를 단일 모놀리식 프레임워크(예: Laravel)로 구성
- 영향 범위: 개발자 역량 요구, 배포 방식, 성능 튜닝 전략

## 코딩/아키텍처 원칙
- 도메인 우선 설계: 화면 설계보다 **도메인/데이터 모델(품목/BOM/재고/계획/발주)**을 먼저 맞춘다.
- 단순성 유지: 복잡한 최적화 대신, 이해하기 쉬운 로직과 명확한 테이블 구조를 우선한다.
- API 일관성: RESTful 규칙(복수형 리소스명, 일관된 상태코드/에러 형식)을 유지한다.

## 리스크 및 제약
- 보안 제약: 초기에는 내부망/인증된 사용자만 접근을 가정, 외부 노출 시 추가 보안(SSO, HTTPS, WAF 등) 필요.
- 성능 제약: 대규모 품목/거래 데이터에서 MRP/리포트 성능 이슈 가능 → 인덱싱, 배치 처리, 캐싱을 통해 완화.
- 일정 제약: 실제 업무 요구 변경이 잦을 수 있어, 1차 릴리즈 범위를 엄격히 관리해야 함.
- 운영 제약: 초기에는 소규모 팀이 운영·모니터링을 담당, 자동화 수준이 낮을 수 있음.

## 기술 스택 상세
- React + TypeScript + Vite:
  - SPA, 빠른 개발·HMR 지원, Vercel/Netlify 등 정적 호스팅과 궁합이 좋음.
- Node.js + NestJS (후보):
  - 모듈형 구조, DI·밸리데이션·Guard 등 API 개발에 적합한 패턴 제공.
- PostgreSQL:
  - 관계형 모델에 적합, JSON/함수 등 확장 기능이 풍부.

## 참고 자료
- 외부 링크: SCM/MRP 개념 정리 문서, Vercel 배포 가이드 등 (추가 예정)
- 디자인 링크: [추가 예정 – Figma/디자인 시스템 링크]
- 문서 링크: `기획서_TEMPLATE.md`, `계획서_TEMPLATE.md`, `CHECKLIST_TEMPLATE.md`, `PLAN_TEMPLATE.md`

## AI에게 요청할 때 예시
- "@CONTEXT_TEMPLATE.md 기준으로 MRP 기능만 확장했을 때 영향을 받는 모듈을 정리해줘."
- "@CONTEXT_TEMPLATE.md와 PLAN_TEMPLATE.md를 참고해서 수요예측 화면 API 스펙을 제안해줘."
