-- Migration 007: Create workout sessions and related tables
-- Stores completed training sessions and exercise performance history

-- Workout sessions table - completed training sessions per profile
CREATE TABLE workout_sessions (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL, -- NULL if routine was deleted
    routine_name VARCHAR(255) NOT NULL, -- Store routine name for history
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
    day_name VARCHAR(20) NOT NULL, -- "Lunes", "Martes", etc.
    session_date DATE NOT NULL, -- Date when session was completed
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER, -- Calculated or user-provided
    notes TEXT, -- Session notes
    rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5), -- Session difficulty/satisfaction rating
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_session_day_names CHECK (day_name IN ('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    CONSTRAINT positive_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT valid_time_range CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time)
);

-- Workout session exercises - exercises performed in a session with actual values
CREATE TABLE workout_session_exercises (
    id SERIAL PRIMARY KEY,
    workout_session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL, -- Store name for history
    exercise_image VARCHAR(500), -- Store image URL for history
    order_in_session INTEGER NOT NULL,
    notes TEXT, -- Exercise-specific notes for this session
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_order CHECK (order_in_session > 0),
    CONSTRAINT unique_order_per_session UNIQUE(workout_session_id, order_in_session)
);

-- Workout session sets - individual sets performed with actual reps/weight/etc
CREATE TABLE workout_session_sets (
    id SERIAL PRIMARY KEY,
    workout_session_exercise_id INTEGER NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER, -- Actual reps performed (NULL for time-based)
    weight DECIMAL(6,2), -- Actual weight used
    duration_seconds INTEGER, -- For time-based exercises
    rir INTEGER CHECK (rir IS NULL OR rir BETWEEN 0 AND 10), -- Reps in Reserve
    rpe INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    rest_seconds INTEGER, -- Actual rest time taken
    is_completed BOOLEAN DEFAULT FALSE,
    is_warmup BOOLEAN DEFAULT FALSE,
    notes TEXT, -- Set-specific notes
    -- Advanced techniques
    rest_pause_reps INTEGER[], -- Array of rest-pause reps [8, 3, 2]
    drop_set_weights DECIMAL(6,2)[], -- Array of drop set weights [80, 60, 40]
    partial_reps INTEGER, -- Number of partial reps at end
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints  
    CONSTRAINT positive_set_number CHECK (set_number > 0),
    CONSTRAINT positive_reps CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT positive_weight CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT reps_or_duration CHECK (reps IS NOT NULL OR duration_seconds IS NOT NULL),
    CONSTRAINT positive_rest CHECK (rest_seconds IS NULL OR rest_seconds >= 0),
    CONSTRAINT positive_partial_reps CHECK (partial_reps IS NULL OR partial_reps > 0),
    CONSTRAINT unique_set_per_exercise UNIQUE(workout_session_exercise_id, set_number)
);

-- Indexes for performance
CREATE INDEX idx_workout_sessions_profile_id ON workout_sessions(profile_id);
CREATE INDEX idx_workout_sessions_routine_id ON workout_sessions(routine_id);
CREATE INDEX idx_workout_sessions_session_date ON workout_sessions(session_date);
CREATE INDEX idx_workout_sessions_day_of_week ON workout_sessions(day_of_week);
CREATE INDEX idx_workout_sessions_is_completed ON workout_sessions(is_completed);

CREATE INDEX idx_workout_session_exercises_session_id ON workout_session_exercises(workout_session_id);
CREATE INDEX idx_workout_session_exercises_exercise_id ON workout_session_exercises(exercise_id);
CREATE INDEX idx_workout_session_exercises_order ON workout_session_exercises(workout_session_id, order_in_session);

CREATE INDEX idx_workout_session_sets_exercise_id ON workout_session_sets(workout_session_exercise_id);
CREATE INDEX idx_workout_session_sets_set_number ON workout_session_sets(workout_session_exercise_id, set_number);
CREATE INDEX idx_workout_session_sets_is_completed ON workout_session_sets(is_completed);

-- Triggers for updated_at
CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON workout_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get workout history for a profile
CREATE OR REPLACE FUNCTION get_workout_history(target_profile_id INTEGER, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    session_date DATE,
    day_name VARCHAR(20),
    routine_name VARCHAR(255),
    duration_minutes INTEGER,
    exercises_count INTEGER,
    total_sets INTEGER,
    rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.session_date,
        ws.day_name,
        ws.routine_name,
        ws.duration_minutes,
        COUNT(DISTINCT wse.id)::INTEGER as exercises_count,
        COUNT(wss.id)::INTEGER as total_sets,
        ws.rating
    FROM workout_sessions ws
    LEFT JOIN workout_session_exercises wse ON ws.id = wse.workout_session_id
    LEFT JOIN workout_session_sets wss ON wse.id = wss.workout_session_exercise_id AND wss.is_completed = TRUE
    WHERE ws.profile_id = target_profile_id
    AND ws.is_completed = TRUE
    AND ws.session_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
    GROUP BY ws.id, ws.session_date, ws.day_name, ws.routine_name, ws.duration_minutes, ws.rating
    ORDER BY ws.session_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get exercise progress (weight/reps over time)
CREATE OR REPLACE FUNCTION get_exercise_progress(target_profile_id INTEGER, target_exercise_id INTEGER, days_back INTEGER DEFAULT 90)
RETURNS TABLE (
    session_date DATE,
    max_weight DECIMAL(6,2),
    max_reps INTEGER,
    total_volume DECIMAL(10,2) -- weight * reps summed
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.session_date,
        MAX(wss.weight) as max_weight,
        MAX(wss.reps) as max_reps,
        SUM(COALESCE(wss.weight, 0) * COALESCE(wss.reps, 0))::DECIMAL(10,2) as total_volume
    FROM workout_sessions ws
    JOIN workout_session_exercises wse ON ws.id = wse.workout_session_id
    JOIN workout_session_sets wss ON wse.id = wss.workout_session_exercise_id
    WHERE ws.profile_id = target_profile_id
    AND wse.exercise_id = target_exercise_id
    AND ws.is_completed = TRUE
    AND wss.is_completed = TRUE
    AND wss.is_warmup = FALSE
    AND ws.session_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
    GROUP BY ws.session_date
    ORDER BY ws.session_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE workout_sessions IS 'Completed training sessions with metadata and performance';
COMMENT ON TABLE workout_session_exercises IS 'Exercises performed in a specific workout session';
COMMENT ON TABLE workout_session_sets IS 'Individual sets performed with actual performance data';

COMMENT ON COLUMN workout_sessions.profile_id IS 'Links to user profile - sessions are profile-specific';
COMMENT ON COLUMN workout_sessions.routine_name IS 'Stored routine name for history (in case routine is deleted)';
COMMENT ON COLUMN workout_sessions.session_date IS 'Date when workout was completed';
COMMENT ON COLUMN workout_sessions.rating IS 'User rating of workout difficulty/satisfaction (1-5)';

COMMENT ON COLUMN workout_session_sets.rest_pause_reps IS 'Array of reps in rest-pause sets: [8, 3, 2]';
COMMENT ON COLUMN workout_session_sets.drop_set_weights IS 'Array of weights in drop sets: [80, 60, 40]';
COMMENT ON COLUMN workout_session_sets.partial_reps IS 'Number of partial reps performed at end of set';

COMMENT ON FUNCTION get_workout_history IS 'Gets workout session history for a profile with summary stats';
COMMENT ON FUNCTION get_exercise_progress IS 'Gets exercise progress over time (weight, reps, volume)';