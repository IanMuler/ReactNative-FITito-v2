-- ============================================================================
-- Fix for upsert_session_history function
-- ============================================================================
-- Issue: Function was causing duplicate key violations when syncing offline data
-- Solution: Check if session exists first, return existing ID if found
-- Business Rule: Only ONE session per (profile_id, session_date) - NO editing allowed
-- ============================================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS upsert_session_history(INTEGER, DATE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, TIMESTAMP, INTEGER, JSONB, TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION upsert_session_history(
    target_profile_id INTEGER,
    target_session_date DATE,
    target_session_uuid VARCHAR,
    target_routine_name VARCHAR,
    target_day_name VARCHAR,
    target_status VARCHAR,
    target_start_time TIMESTAMP,
    target_end_time TIMESTAMP,
    target_duration_minutes INTEGER,
    target_session_data JSONB,
    target_notes TEXT,
    target_total_exercises INTEGER,
    target_completed_exercises INTEGER,
    target_total_sets INTEGER,
    target_completed_sets INTEGER
) RETURNS INTEGER AS $$
DECLARE
    existing_id INTEGER;
BEGIN
    -- Check if a session already exists for this profile and date
    SELECT id INTO existing_id
    FROM session_history
    WHERE profile_id = target_profile_id
      AND session_date = target_session_date;

    -- If session exists, return the existing ID (do NOT update)
    IF existing_id IS NOT NULL THEN
        RETURN existing_id;
    END IF;

    -- If session does not exist, insert new record
    INSERT INTO session_history (
        profile_id,
        session_date,
        session_uuid,
        routine_name,
        day_name,
        status,
        start_time,
        end_time,
        duration_minutes,
        session_data,
        notes,
        total_exercises,
        completed_exercises,
        total_sets,
        completed_sets
    ) VALUES (
        target_profile_id,
        target_session_date,
        target_session_uuid,
        target_routine_name,
        target_day_name,
        target_status,
        target_start_time,
        target_end_time,
        target_duration_minutes,
        target_session_data,
        target_notes,
        target_total_exercises,
        target_completed_exercises,
        target_total_sets,
        target_completed_sets
    ) RETURNING id INTO existing_id;

    RETURN existing_id;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION upsert_session_history IS 'Creates new session history or returns existing ID if session already exists for that profile and date. Does NOT update existing sessions.';
