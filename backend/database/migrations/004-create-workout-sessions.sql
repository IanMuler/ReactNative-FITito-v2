-- Migration 004: Create workout sessions and workout sets tables
-- Profile-specific workout sessions and performance tracking

CREATE TABLE workout_sessions (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
    name VARCHAR(255), -- Custom session name (if different from routine)
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_minutes INTEGER,
    total_weight_lifted DECIMAL(10,2), -- Sum of all sets weight * reps
    total_sets INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    average_rpe DECIMAL(3,1) CHECK (average_rpe IS NULL OR average_rpe BETWEEN 1 AND 10),
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    workout_type VARCHAR(50) DEFAULT 'strength', -- strength, cardio, flexibility, etc.
    location VARCHAR(100), -- gym, home, etc.
    mood_before INTEGER CHECK (mood_before IS NULL OR mood_before BETWEEN 1 AND 5),
    mood_after INTEGER CHECK (mood_after IS NULL OR mood_after BETWEEN 1 AND 5),
    energy_before INTEGER CHECK (energy_before IS NULL OR energy_before BETWEEN 1 AND 5),
    energy_after INTEGER CHECK (energy_after IS NULL OR energy_after BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT workout_sessions_completed_logic CHECK (
        (is_completed = FALSE AND completed_at IS NULL) OR 
        (is_completed = TRUE AND completed_at IS NOT NULL)
    ),
    CONSTRAINT workout_sessions_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT workout_sessions_weight_positive CHECK (total_weight_lifted IS NULL OR total_weight_lifted >= 0)
);

-- Workout sets (individual sets performed during a session)
CREATE TABLE workout_sets (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    routine_exercise_id INTEGER REFERENCES routine_exercises(id) ON DELETE SET NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER, -- NULL for time-based exercises
    weight DECIMAL(6,2), -- kg or lbs
    duration_seconds INTEGER, -- For time-based exercises
    distance_meters DECIMAL(8,2), -- For cardio exercises
    rpe INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
    rest_time_seconds INTEGER,
    notes TEXT,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT workout_sets_set_number_positive CHECK (set_number > 0),
    CONSTRAINT workout_sets_reps_positive CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT workout_sets_weight_positive CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT workout_sets_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT workout_sets_distance_positive CHECK (distance_meters IS NULL OR distance_meters >= 0),
    CONSTRAINT workout_sets_rest_positive CHECK (rest_time_seconds IS NULL OR rest_time_seconds >= 0)
);

-- Personal records tracking
CREATE TABLE personal_records (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('1rm', 'volume', 'reps', 'time', 'distance')),
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10) NOT NULL, -- kg, lbs, seconds, meters, etc.
    reps INTEGER, -- For 1RM calculations
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER REFERENCES workout_sessions(id) ON DELETE SET NULL,
    notes TEXT,
    is_estimated BOOLEAN DEFAULT FALSE, -- If calculated vs actually performed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT personal_records_value_positive CHECK (value > 0),
    CONSTRAINT personal_records_reps_positive CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT personal_records_unique_record UNIQUE(profile_id, exercise_id, record_type)
);

-- Indexes for performance
CREATE INDEX idx_workout_sessions_profile_id ON workout_sessions(profile_id);
CREATE INDEX idx_workout_sessions_routine_id ON workout_sessions(routine_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);
CREATE INDEX idx_workout_sessions_is_completed ON workout_sessions(is_completed);
CREATE INDEX idx_workout_sessions_workout_type ON workout_sessions(workout_type);

CREATE INDEX idx_workout_sets_session_id ON workout_sets(session_id);
CREATE INDEX idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX idx_workout_sets_completed_at ON workout_sets(completed_at);
CREATE INDEX idx_workout_sets_is_warmup ON workout_sets(is_warmup);

CREATE INDEX idx_personal_records_profile_id ON personal_records(profile_id);
CREATE INDEX idx_personal_records_exercise_id ON personal_records(exercise_id);
CREATE INDEX idx_personal_records_record_type ON personal_records(record_type);
CREATE INDEX idx_personal_records_achieved_at ON personal_records(achieved_at);

-- Triggers for updated_at
CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON workout_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at 
    BEFORE UPDATE ON workout_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE workout_sessions IS 'Individual workout sessions - profile-specific';
COMMENT ON TABLE workout_sets IS 'Individual sets performed during workout sessions';
COMMENT ON TABLE personal_records IS 'Personal records tracking per profile and exercise';
COMMENT ON COLUMN workout_sessions.total_weight_lifted IS 'Sum of (weight * reps) for all sets in session';
COMMENT ON COLUMN workout_sessions.mood_before IS 'Mood rating before workout (1-5 scale)';
COMMENT ON COLUMN workout_sessions.energy_before IS 'Energy level before workout (1-5 scale)';
COMMENT ON COLUMN personal_records.is_estimated IS 'Whether the record was calculated (e.g., 1RM estimation) vs actually performed';