-- (주)새론 통합관리 시스템 - Supabase 초기 설정
-- Supabase 대시보드 > SQL Editor > New query 에서 실행하세요

-- 1. 데이터 저장 테이블 생성
CREATE TABLE IF NOT EXISTS app_data (
  collection  TEXT PRIMARY KEY,
  items       JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 등록
DROP TRIGGER IF EXISTS set_updated_at ON app_data;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. 인증 없이 읽기/쓰기 허용 (사내 전용 시스템)
ALTER TABLE app_data DISABLE ROW LEVEL SECURITY;

-- 5. 실시간 동기화 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;

-- 확인
SELECT 'app_data 테이블 생성 완료' AS result;
