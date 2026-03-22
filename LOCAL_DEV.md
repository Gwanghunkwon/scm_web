# 로컬 / 배포 브라우저 주소

- **로컬:** http://localhost:3000  
- **Vercel(예시):** https://scm-web-delta.vercel.app/  

Vercel에서 API가 안 붙으면 `NEXT_PUBLIC_API_URL` 설정이 필요합니다 → **`docs/VERCEL.md`** 참고.

---

# 로컬에서 브라우저로 바로 보기

## 한 번에 실행 (권장)

저장소 **루트**(`SCM` 폴더)에서:

```bash
npm install
npm run dev
```

- **API**: http://127.0.0.1:8000  
- **웹(Next)**: http://localhost:3000  

브라우저에서 **http://localhost:3000** 을 열면 됩니다.

> `python`과 `pip`로 백엔드 의존성이 설치되어 있어야 합니다. (아래 참고)

## 백엔드 의존성 (최초 1회)

```bash
cd backend
pip install -r requirements.txt
```

## 프론트 의존성 (최초 1회)

```bash
cd frontend
npm install
```

## API 주소가 다를 때

`frontend/.env.local` 파일을 만들고:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 수동으로 나눠 실행

터미널 1:

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

터미널 2:

```bash
cd frontend
npm run dev
```

---

**데이터 흐름**: 품목·BOM·재고·생산계획은 백엔드 DB에 저장되고, 대시보드는 `GET /api/dashboard`로 그 데이터를 읽어 계산합니다.  
생산계획은 대시보드에서 **「생산계획 수량 자동 반영」**이 켜져 있으면, 선택한 기간(3/6/12개월)과 겹치는 계획 수량 합계가 예상 생산량으로 들어갑니다.
