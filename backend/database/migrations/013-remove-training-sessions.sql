-- Migration 013: Remove training sessions system
-- Eliminates active training session tracking, frontend will use AsyncStorage

-- First, drop all foreign key constraints that reference training_sessions
-- (These will be dropped automatically when we drop the table, but being explicit)

-- Drop triggers first
DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
DROP TRIGGER IF EXISTS update_training_session_exercises_updated_at ON training_session_exercises;
DROP TRIGGER IF EXISTS update_training_session_progress_updated_at ON training_session_progress;

-- Drop functions that depend on these tables
DROP FUNCTION IF EXISTS get_active_training_session(INTEGER);
DROP FUNCTION IF EXISTS complete_training_session(INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_training_sessions(INTEGER);

-- Drop indexes explicitly (although they'll be dropped with tables)
DROP INDEX IF EXISTS idx_training_sessions_profile_id;
DROP INDEX IF EXISTS idx_training_sessions_status;
DROP INDEX IF EXISTS idx_training_sessions_day_of_week;
DROP INDEX IF EXISTS idx_training_sessions_last_activity;

DROP INDEX IF EXISTS idx_training_session_exercises_session_id;
DROP INDEX IF EXISTS idx_training_session_exercises_exercise_id;
DROP INDEX IF EXISTS idx_training_session_exercises_order;

DROP INDEX IF EXISTS idx_training_session_progress_session_id;
DROP INDEX IF EXISTS idx_training_session_progress_exercise_id;
DROP INDEX IF EXISTS idx_training_session_progress_completed;

-- Drop tables in correct order (child tables first due to foreign keys)
DROP TABLE IF EXISTS training_session_progress CASCADE;
DROP TABLE IF EXISTS training_session_exercises CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS training_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS training_session_exercises_id_seq CASCADE;
DROP SEQUENCE IF EXISTS training_session_progress_id_seq CASCADE;

-- Add comment documenting the change
COMMENT ON SCHEMA public IS 'Training sessions system removed in migration 013 - session state now handled in frontend AsyncStorage';

-- Verification queries (commented out, run manually if needed)
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%training_session%';
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%training_session%';