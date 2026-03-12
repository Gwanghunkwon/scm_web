-- 기본 마스터 데이터 예시 (단위, 코드값 등)

-- 단위(Unit) 예시: 현재는 item.uom에 문자열로 직접 사용
-- 필요 시 별도 unit 테이블을 만들고 FK로 연결할 수 있다.

-- 예시 품목 데이터
INSERT INTO item (code, name, type, uom, safety_stock_qty, lead_time_days, is_active)
VALUES
  ('FG-001', '완제품 1', 'PRODUCT', 'EA', 100, 7, TRUE),
  ('RM-001', '원자재 1', 'RAW', 'KG', 500, 14, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 예시 창고 데이터
INSERT INTO warehouse (code, name)
VALUES
  ('WH-01', '본사 창고'),
  ('WH-02', '외부 보세창고')
ON CONFLICT (code) DO NOTHING;

