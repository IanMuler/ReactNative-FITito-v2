-- Migration 014: Create session history table
-- Stores completed/cancelled session history independent of other tables

-- Session history table - one record per profile per date
CREATE TABLE session_history (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL, -- Date when the session occurred
    session_uuid VARCHAR(100) NOT NULL, -- Original UUID from AsyncStorage
    
    -- Basic session info (copied data, not referenced)
    routine_name VARCHAR(255) NOT NULL, -- Copied routine name
    day_name VARCHAR(50) NOT NULL, -- Day name (Lunes, Martes, etc.)
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'cancelled')),
    
    -- Timing information
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    
    -- Complete session data stored as JSONB (independent of other tables)
    session_data JSONB NOT NULL, -- Full exercise and set data
    
    -- Additional information
    notes TEXT,
    total_exercises INTEGER DEFAULT 0,
    completed_exercises INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    completed_sets INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT session_history_unique_profile_date UNIQUE(profile_id, session_date),
    CONSTRAINT session_history_end_after_start CHECK (end_time >= start_time),
    CONSTRAINT session_history_valid_counts CHECK (
        completed_exercises <= total_exercises AND
        completed_sets <= total_sets AND
        total_exercises >= 0 AND
        completed_exercises >= 0 AND
        total_sets >= 0 AND
        completed_sets >= 0
    )
);

-- Indexes for performance
CREATE INDEX idx_session_history_profile_id ON session_history(profile_id);
CREATE INDEX idx_session_history_session_date ON session_history(session_date);
CREATE INDEX idx_session_history_status ON session_history(status);
CREATE INDEX idx_session_history_profile_date ON session_history(profile_id, session_date);
CREATE INDEX idx_session_history_created_at ON session_history(created_at);

-- GIN index for JSONB queries
CREATE INDEX idx_session_history_session_data ON session_history USING GIN (session_data);

-- Trigger for updated_at
CREATE TRIGGER update_session_history_updated_at 
    BEFORE UPDATE ON session_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get session history for a profile
CREATE OR REPLACE FUNCTION get_session_history(target_profile_id INTEGER, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id INTEGER,
    session_date DATE,
    routine_name VARCHAR(255),
    day_name VARCHAR(50),
    status VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    total_exercises INTEGER,
    completed_exercises INTEGER,
    total_sets INTEGER,
    completed_sets INTEGER,
    notes TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.id,
        sh.session_date,
        sh.routine_name,
        sh.day_name,
        sh.status,
        sh.start_time,
        sh.end_time,
        sh.duration_minutes,
        sh.total_exercises,
        sh.completed_exercises,
        sh.total_sets,
        sh.completed_sets,
        sh.notes,
        sh.created_at
    FROM session_history sh
    WHERE sh.profile_id = target_profile_id
    ORDER BY sh.session_date DESC, sh.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get session history by specific date
CREATE OR REPLACE FUNCTION get_session_history_by_date(target_profile_id INTEGER, target_date DATE)
RETURNS TABLE (
    id INTEGER,
    session_uuid VARCHAR(100),
    routine_name VARCHAR(255),
    day_name VARCHAR(50),
    status VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    session_data JSONB,
    total_exercises INTEGER,
    completed_exercises INTEGER,
    total_sets INTEGER,
    completed_sets INTEGER,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.id,
        sh.session_uuid,
        sh.routine_name,
        sh.day_name,
        sh.status,
        sh.start_time,
        sh.end_time,
        sh.duration_minutes,
        sh.session_data,
        sh.total_exercises,
        sh.completed_exercises,
        sh.total_sets,
        sh.completed_sets,
        sh.notes,
        sh.created_at,
        sh.updated_at
    FROM session_history sh
    WHERE sh.profile_id = target_profile_id 
    AND sh.session_date = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert session history (insert or update if exists for same profile+date)
CREATE OR REPLACE FUNCTION upsert_session_history(
    target_profile_id INTEGER,
    target_session_date DATE,
    target_session_uuid VARCHAR(100),
    target_routine_name VARCHAR(255),
    target_day_name VARCHAR(50),
    target_status VARCHAR(20),
    target_start_time TIMESTAMP,
    target_end_time TIMESTAMP,
    target_duration_minutes INTEGER,
    target_session_data JSONB,
    target_notes TEXT DEFAULT NULL,
    target_total_exercises INTEGER DEFAULT 0,
    target_completed_exercises INTEGER DEFAULT 0,
    target_total_sets INTEGER DEFAULT 0,
    target_completed_sets INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
    result_id INTEGER;
BEGIN
    -- Attempt to update existing record
    UPDATE session_history 
    SET 
        session_uuid = target_session_uuid,
        routine_name = target_routine_name,
        day_name = target_day_name,
        status = target_status,
        start_time = target_start_time,
        end_time = target_end_time,
        duration_minutes = target_duration_minutes,
        session_data = target_session_data,
        notes = target_notes,
        total_exercises = target_total_exercises,
        completed_exercises = target_completed_exercises,
        total_sets = target_total_sets,
        completed_sets = target_completed_sets,
        updated_at = CURRENT_TIMESTAMP
    WHERE profile_id = target_profile_id 
    AND session_date = target_session_date
    RETURNING id INTO result_id;
    
    -- If no row was updated, insert new record
    IF result_id IS NULL THEN
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
        ) RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE session_history IS 'Historical record of completed/cancelled training sessions - one per profile per date';
COMMENT ON COLUMN session_history.session_date IS 'Date when the session occurred (not when it was recorded)';
COMMENT ON COLUMN session_history.session_uuid IS 'Original UUID from AsyncStorage for tracking';
COMMENT ON COLUMN session_history.session_data IS 'Complete exercise and set data stored as JSONB - independent of other tables';
COMMENT ON COLUMN session_history.status IS 'Session final status: completed or cancelled';
-- Note: PostgreSQL doesn't support comments on constraints directly, so documenting here:
-- session_history_unique_profile_date: Ensures one history record per profile per date - latest session overwrites previous

COMMENT ON FUNCTION get_session_history IS 'Gets paginated session history for a profile, ordered by date desc';
COMMENT ON FUNCTION get_session_history_by_date IS 'Gets complete session history data for a specific profile and date';
COMMENT ON FUNCTION upsert_session_history IS 'Inserts new session history or updates existing for same profile+date';