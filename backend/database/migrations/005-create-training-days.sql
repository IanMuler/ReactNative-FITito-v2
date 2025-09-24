-- Migration 005: Create training days and related tables
-- Training days are profile-specific workout templates

-- Training days table - stores workout day templates per profile
CREATE TABLE training_days (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: unique training day names per profile
    CONSTRAINT unique_training_day_per_profile UNIQUE(profile_id, name),
    CONSTRAINT training_days_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT training_days_name_format CHECK (name ~ '^[A-Za-z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$')
);

-- Training day exercises junction table - many-to-many relationship
CREATE TABLE training_day_exercises (
    id SERIAL PRIMARY KEY,
    training_day_id INTEGER NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    sets INTEGER DEFAULT 3,
    reps INTEGER DEFAULT 12,
    weight DECIMAL(5,2),
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: unique exercise per training day
    CONSTRAINT unique_exercise_per_training_day UNIQUE(training_day_id, exercise_id),
    CONSTRAINT positive_sets CHECK (sets > 0),
    CONSTRAINT positive_reps CHECK (reps > 0),
    CONSTRAINT positive_weight CHECK (weight IS NULL OR weight > 0),
    CONSTRAINT positive_rest CHECK (rest_seconds >= 0)
);

-- Indexes for optimal query performance
CREATE INDEX idx_training_days_profile_id ON training_days(profile_id);
CREATE INDEX idx_training_days_is_active ON training_days(is_active);
CREATE INDEX idx_training_days_name ON training_days(name);
CREATE INDEX idx_training_days_created_at ON training_days(created_at);

CREATE INDEX idx_training_day_exercises_training_day_id ON training_day_exercises(training_day_id);
CREATE INDEX idx_training_day_exercises_exercise_id ON training_day_exercises(exercise_id);
CREATE INDEX idx_training_day_exercises_order_index ON training_day_exercises(order_index);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_training_days_updated_at 
    BEFORE UPDATE ON training_days 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate training day has at least one exercise
CREATE OR REPLACE FUNCTION validate_training_day_has_exercises()
RETURNS TRIGGER AS $$
BEGIN
    -- When deleting an exercise from a training day, ensure at least one remains
    IF TG_OP = 'DELETE' THEN
        IF (SELECT COUNT(*) FROM training_day_exercises 
            WHERE training_day_id = OLD.training_day_id) <= 1 THEN
            RAISE EXCEPTION 'Training day must have at least one exercise';
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure training days always have exercises
CREATE TRIGGER enforce_training_day_has_exercises
    BEFORE DELETE ON training_day_exercises
    FOR EACH ROW EXECUTE FUNCTION validate_training_day_has_exercises();

-- Comments for documentation
COMMENT ON TABLE training_days IS 'Workout day templates associated with user profiles';
COMMENT ON TABLE training_day_exercises IS 'Junction table linking training days to exercises with workout parameters';

COMMENT ON COLUMN training_days.profile_id IS 'Reference to user_profiles - training days are profile-specific';
COMMENT ON COLUMN training_days.name IS 'User-defined name for the training day (e.g., "Chest Day", "Full Body")';
COMMENT ON COLUMN training_days.is_active IS 'Soft delete flag - inactive training days are hidden but preserved';

COMMENT ON COLUMN training_day_exercises.order_index IS 'Defines the order of exercises within a training day';
COMMENT ON COLUMN training_day_exercises.sets IS 'Recommended number of sets for this exercise';
COMMENT ON COLUMN training_day_exercises.reps IS 'Recommended number of repetitions per set';
COMMENT ON COLUMN training_day_exercises.weight IS 'Recommended weight in kg (can be null for bodyweight exercises)';
COMMENT ON COLUMN training_day_exercises.rest_seconds IS 'Recommended rest time between sets in seconds';