-- Migration 003: Create routines and routine_exercises tables
-- Profile-specific routines (cada perfil tiene sus propias rutinas)

CREATE TABLE routines (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#4A90E2', -- Hex color for UI
    duration_minutes INTEGER, -- Estimated duration
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT routines_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT routines_valid_color CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT routines_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Routine exercises (exercises in a routine with specific parameters)
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_in_routine INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1,
    reps INTEGER, -- NULL for time-based exercises
    weight DECIMAL(6,2), -- kg or lbs based on profile settings
    duration_seconds INTEGER, -- For time-based exercises
    rest_time_seconds INTEGER DEFAULT 60,
    rpe INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    notes TEXT,
    is_superset BOOLEAN DEFAULT FALSE,
    superset_group INTEGER, -- Group ID for supersets
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT routine_exercises_sets_positive CHECK (sets > 0),
    CONSTRAINT routine_exercises_reps_positive CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT routine_exercises_weight_positive CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT routine_exercises_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT routine_exercises_rest_positive CHECK (rest_time_seconds >= 0),
    CONSTRAINT routine_exercises_reps_or_duration CHECK (reps IS NOT NULL OR duration_seconds IS NOT NULL),
    CONSTRAINT routine_exercises_unique_order UNIQUE(routine_id, order_in_routine)
);

-- Indexes for performance
CREATE INDEX idx_routines_profile_id ON routines(profile_id);
CREATE INDEX idx_routines_is_active ON routines(is_active);
CREATE INDEX idx_routines_is_favorite ON routines(is_favorite);
CREATE INDEX idx_routines_difficulty ON routines(difficulty_level);
CREATE INDEX idx_routines_tags ON routines USING GIN(tags);
CREATE INDEX idx_routines_name_search ON routines USING GIN(to_tsvector('english', name));

CREATE INDEX idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);
CREATE INDEX idx_routine_exercises_order ON routine_exercises(routine_id, order_in_routine);
CREATE INDEX idx_routine_exercises_superset ON routine_exercises(routine_id, superset_group) WHERE superset_group IS NOT NULL;

-- Triggers for updated_at
CREATE TRIGGER update_routines_updated_at 
    BEFORE UPDATE ON routines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_exercises_updated_at 
    BEFORE UPDATE ON routine_exercises 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE routines IS 'User routines - profile-specific workout plans';
COMMENT ON TABLE routine_exercises IS 'Exercises within routines with specific parameters';
COMMENT ON COLUMN routines.profile_id IS 'Links routine to specific user profile';
COMMENT ON COLUMN routines.color IS 'Hex color for UI representation';
COMMENT ON COLUMN routine_exercises.rpe IS 'Rate of Perceived Exertion (1-10 scale)';
COMMENT ON COLUMN routine_exercises.superset_group IS 'Groups exercises that should be performed as supersets';
COMMENT ON COLUMN routine_exercises.order_in_routine IS 'Defines the order of exercises in the routine';