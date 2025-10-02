-- Migration 015: Remove completed_date from routine_weeks
-- Session completion is now tracked via session_history.session_date instead

-- Remove index
DROP INDEX IF EXISTS idx_routine_weeks_completed_date;

-- Remove column
ALTER TABLE routine_weeks DROP COLUMN IF EXISTS completed_date;

COMMENT ON TABLE routine_weeks IS 'Weekly routine schedule for user profiles. Session completion tracked in session_history table.';
