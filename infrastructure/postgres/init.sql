-- ─────────────────────────────────────────
-- PostgreSQL Initialization Script
-- DiemDanh – Face Recognition Attendance System
-- ─────────────────────────────────────────

-- Enable uuid-ossp for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text / trigram search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable btree_gin for efficient GIN indexes on scalar types
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ─────────────────────────────────────────
-- Timezone
-- ─────────────────────────────────────────
SET timezone = 'Asia/Ho_Chi_Minh';

-- Persist timezone to the database
ALTER DATABASE diemdanh SET timezone TO 'Asia/Ho_Chi_Minh';

-- ─────────────────────────────────────────
-- Useful defaults
-- ─────────────────────────────────────────
-- Ensure the search_path is explicitly set
ALTER DATABASE diemdanh SET search_path TO public;

-- Log a confirmation message
DO $$
BEGIN
    RAISE NOTICE 'DiemDanh database initialized successfully at %', NOW();
END
$$;
