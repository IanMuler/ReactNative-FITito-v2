-- Migration 010: Create training sessions system
-- Extends existing workout_sessions for active training session management

-- Training sessions table - active training sessions (in progress)
-- Different from workout_sessions which are completed sessions
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    routine_week_id INTEGER REFERENCES routine_weeks(id) ON DELETE SET NULL,
    routine_name VARCHAR(255) NOT NULL, -- From routine configuration
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Domingo, 2=Lunes, etc.
    day_name VARCHAR(20) NOT NULL, -- "Lunes", "Martes", etc.
    
    -- Session state
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    current_exercise_index INTEGER DEFAULT 0,
    
    -- Timing
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Session metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_session_day_names CHECK (day_name IN ('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    CONSTRAINT positive_exercise_index CHECK (current_exercise_index >= 0)
);

-- Training session exercises - exercises in active session with configuration
CREATE TABLE training_session_exercises (
    id SERIAL PRIMARY KEY,
    training_session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL, -- Store name for consistency
    exercise_image VARCHAR(500), -- Store image URL for consistency
    order_in_session INTEGER NOT NULL,
    
    -- Planned configuration (from routine configuration)
    planned_sets JSONB NOT NULL DEFAULT '[]', -- Array of planned set configurations
    
    -- Current progress
    performed_sets JSONB NOT NULL DEFAULT '[]', -- Array of performed sets
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_order CHECK (order_in_session > 0),
    CONSTRAINT unique_order_per_session UNIQUE(training_session_id, order_in_session)
);

-- Session progress tracking - for real-time updates during training
CREATE TABLE training_session_progress (
    id SERIAL PRIMARY KEY,
    training_session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    
    -- Performed values
    reps INTEGER,
    weight DECIMAL(6,2),
    rir INTEGER CHECK (rir IS NULL OR rir BETWEEN 0 AND 10),
    
    -- Advanced techniques (using JSONB for flexibility)
    rest_pause_details JSONB, -- [{"value": "5", "time": 10}, {"value": "3", "time": 15}]
    drop_set_details JSONB, -- [{"reps": "8", "peso": "60"}, {"reps": "5", "peso": "40"}]
    partials_details JSONB, -- {"reps": "3"}
    
    -- Timing and completion
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_set_number CHECK (set_number > 0),
    CONSTRAINT positive_reps CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT positive_weight CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT unique_set_per_exercise UNIQUE(training_session_id, exercise_id, set_number)
);

-- Indexes for performance
CREATE INDEX idx_training_sessions_profile_id ON training_sessions(profile_id);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);
CREATE INDEX idx_training_sessions_day_of_week ON training_sessions(day_of_week);
CREATE INDEX idx_training_sessions_last_activity ON training_sessions(last_activity);

CREATE INDEX idx_training_session_exercises_session_id ON training_session_exercises(training_session_id);
CREATE INDEX idx_training_session_exercises_exercise_id ON training_session_exercises(exercise_id);
CREATE INDEX idx_training_session_exercises_order ON training_session_exercises(training_session_id, order_in_session);

CREATE INDEX idx_training_session_progress_session_id ON training_session_progress(training_session_id);
CREATE INDEX idx_training_session_progress_exercise_id ON training_session_progress(exercise_id);
CREATE INDEX idx_training_session_progress_completed ON training_session_progress(is_completed);

-- Triggers for updated_at
CREATE TRIGGER update_training_sessions_updated_at 
    BEFORE UPDATE ON training_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_session_exercises_updated_at 
    BEFORE UPDATE ON training_session_exercises 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_session_progress_updated_at 
    BEFORE UPDATE ON training_session_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active training session for a profile
CREATE OR REPLACE FUNCTION get_active_training_session(target_profile_id INTEGER)
RETURNS TABLE (
    session_id INTEGER,
    routine_name VARCHAR(255),
    day_name VARCHAR(20),
    current_exercise_index INTEGER,
    start_time TIMESTAMP,
    last_activity TIMESTAMP,
    exercise_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.routine_name,
        ts.day_name,
        ts.current_exercise_index,
        ts.start_time,
        ts.last_activity,
        COUNT(tse.id)::INTEGER as exercise_count
    FROM training_sessions ts
    LEFT JOIN training_session_exercises tse ON ts.id = tse.training_session_id
    WHERE ts.profile_id = target_profile_id
    AND ts.status = 'active'
    GROUP BY ts.id, ts.routine_name, ts.day_name, ts.current_exercise_index, ts.start_time, ts.last_activity
    ORDER BY ts.last_activity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to complete training session and move to workout_sessions
CREATE OR REPLACE FUNCTION complete_training_session(session_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    training_session_record RECORD;
    new_workout_session_id INTEGER;
    exercise_record RECORD;
    new_exercise_id INTEGER;
    progress_record RECORD;
BEGIN
    -- Get training session details
    SELECT * INTO training_session_record
    FROM training_sessions 
    WHERE id = session_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Training session % not found or not active', session_id;
    END IF;
    
    -- Create workout session
    INSERT INTO workout_sessions (
        profile_id, 
        routine_name, 
        day_of_week, 
        day_name, 
        session_date, 
        start_time, 
        end_time,
        duration_minutes,
        is_completed
    ) VALUES (
        training_session_record.profile_id,
        training_session_record.routine_name,
        training_session_record.day_of_week,
        training_session_record.day_name,
        CURRENT_DATE,
        training_session_record.start_time,
        CURRENT_TIMESTAMP,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - training_session_record.start_time))/60,
        TRUE
    ) RETURNING id INTO new_workout_session_id;
    
    -- Copy exercises to workout session
    FOR exercise_record IN 
        SELECT * FROM training_session_exercises 
        WHERE training_session_id = session_id 
        ORDER BY order_in_session
    LOOP
        INSERT INTO workout_session_exercises (
            workout_session_id,
            exercise_id,
            exercise_name,
            exercise_image,
            order_in_session,
            is_completed
        ) VALUES (
            new_workout_session_id,
            exercise_record.exercise_id,
            exercise_record.exercise_name,
            exercise_record.exercise_image,
            exercise_record.order_in_session,
            exercise_record.is_completed
        ) RETURNING id INTO new_exercise_id;
        
        -- Copy sets from progress to workout sets
        FOR progress_record IN 
            SELECT * FROM training_session_progress 
            WHERE training_session_id = session_id 
            AND exercise_id = exercise_record.exercise_id
            AND is_completed = TRUE
            ORDER BY set_number
        LOOP
            INSERT INTO workout_session_sets (
                workout_session_exercise_id,
                set_number,
                reps,
                weight,
                rir,
                rest_pause_reps,
                drop_set_weights,
                partial_reps,
                is_completed,
                notes
            ) VALUES (
                new_exercise_id,
                progress_record.set_number,
                progress_record.reps,
                progress_record.weight,
                progress_record.rir,
                -- Convert JSONB to arrays for existing schema
                CASE 
                    WHEN progress_record.rest_pause_details IS NOT NULL 
                    THEN ARRAY(SELECT (value::text)::INTEGER FROM jsonb_array_elements(progress_record.rest_pause_details) as value)
                    ELSE NULL 
                END,
                CASE 
                    WHEN progress_record.drop_set_details IS NOT NULL 
                    THEN ARRAY(SELECT (value->>'peso')::DECIMAL(6,2) FROM jsonb_array_elements(progress_record.drop_set_details) as value)
                    ELSE NULL 
                END,
                CASE 
                    WHEN progress_record.partials_details IS NOT NULL 
                    THEN (progress_record.partials_details->>'reps')::INTEGER
                    ELSE NULL 
                END,
                TRUE,
                progress_record.notes
            );
        END LOOP;
    END LOOP;
    
    -- Mark training session as completed
    UPDATE training_sessions 
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = session_id;
    
    RETURN new_workout_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old inactive sessions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_training_sessions(hours_old INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    sessions_cleaned INTEGER;
BEGIN
    -- Delete sessions that are older than specified hours and not active
    DELETE FROM training_sessions 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '%s hours' % hours_old
    AND status IN ('paused', 'cancelled');
    
    GET DIAGNOSTICS sessions_cleaned = ROW_COUNT;
    
    RETURN sessions_cleaned;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE training_sessions IS 'Active training sessions in progress (real-time tracking)';
COMMENT ON TABLE training_session_exercises IS 'Exercises in active training session with planned and performed data';
COMMENT ON TABLE training_session_progress IS 'Real-time progress tracking for sets during active session';

COMMENT ON COLUMN training_sessions.status IS 'Session state: active, paused, completed, cancelled';
COMMENT ON COLUMN training_sessions.current_exercise_index IS 'Index of currently active exercise (0-based)';
COMMENT ON COLUMN training_sessions.last_activity IS 'Last time session was updated (for cleanup)';

COMMENT ON COLUMN training_session_exercises.planned_sets IS 'JSONB array of planned set configurations from routine';
COMMENT ON COLUMN training_session_exercises.performed_sets IS 'JSONB array of performed sets with actual values';

COMMENT ON COLUMN training_session_progress.rest_pause_details IS 'JSONB array: [{"value": "5", "time": 10}]';
COMMENT ON COLUMN training_session_progress.drop_set_details IS 'JSONB array: [{"reps": "8", "peso": "60"}]';
COMMENT ON COLUMN training_session_progress.partials_details IS 'JSONB object: {"reps": "3"}';

COMMENT ON FUNCTION get_active_training_session IS 'Gets active training session for a profile';
COMMENT ON FUNCTION complete_training_session IS 'Completes active session and moves to workout_sessions history';
COMMENT ON FUNCTION cleanup_old_training_sessions IS 'Cleans up old inactive training sessions';