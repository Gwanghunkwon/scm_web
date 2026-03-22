# Vercel 배포 (브라우저 주소)

프로덕션 프론트 주소 예시:

**https://scm-web-delta.vercel.app/**

로컬(`localhost:3000`)이 아니라 **위 주소**로 접속하는 것이 맞습니다.

## 반드시 할 일: 백엔드 URL 연결

Vercel은 브라우저에서 실행되므로, API 주소가 **`localhost`가 아니라** 인터넷에 공개된 백엔드 URL이어야 합니다.

1. Vercel 프로젝트 → **Settings → Environment Variables**
2. 다음 변수 추가 (Production / Preview 모두 권장):
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** 배포된 FastAPI 주소 (예: `https://your-api.onrender.com` — 끝에 `/` 없이)
3. 저장 후 **Redeploy** (환경 변수는 빌드 시 프론트에 포함됨)

`NEXT_PUBLIC_API_URL`이 없으면 기본값이 `http://localhost:8000`이라, 사용자 PC의 로컬 API를 부르려다 실패하고 품목이 비어 있는 것처럼 보일 수 있습니다.

## CORS

백엔드 `cors_origins`에 아래 origin이 포함되어 있어야 합니다.

- `https://scm-web-delta.vercel.app`

(`backend/core/config.py`에 이미 예시로 들어가 있을 수 있음. 다른 도메인을 쓰면 같은 방식으로 추가.)

## 최신 UI 반영

코드에 **품목 등록·내비게이션** 등을 추가했다면, Git 푸시 후 Vercel이 새로 빌드·배포했는지 확인하세요.  
옛 문구만 보이면 **재배포**가 안 됐거나, 위 환경 변수 미설정으로 API가 실패한 경우가 많습니다.
