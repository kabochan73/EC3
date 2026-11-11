-- Pest / PHPUnit用のテストDB。開発DB（ecp）とは別に用意し、
-- RefreshDatabaseが毎回作り直しても開発データに影響しないようにする。
-- postgresコンテナの初回起動（空ボリューム）時に一度だけ実行される。
-- docs/backend/testing.md
CREATE DATABASE ecp_test OWNER ecp;
