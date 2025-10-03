-- ============================================================================
-- FITito Database Schema - Consolidated from Local DB
-- ============================================================================
-- This schema represents the ACTUAL structure of the production database
-- Generated from: Local PostgreSQL database structure on 2025-10-02
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE profile_type AS ENUM ('personal', 'trainer', 'athlete');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS AND PROFILES
-- ============================================================================

-- Users table - authentication and account management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User profiles table - multiple profiles per user
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    profile_type profile_type DEFAULT 'personal',
    is_active BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    weight_unit VARCHAR(10) DEFAULT 'kg',
    distance_unit VARCHAR(10) DEFAULT 'km',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT user_profiles_name_length CHECK (char_length(profile_name) >= 2),
    CONSTRAINT user_profiles_name_format CHECK (profile_name ~* '^[A-Za-z0-9_-]+$'),
    CONSTRAINT user_profiles_unique_name_per_user UNIQUE(user_id, profile_name),
    CONSTRAINT user_profiles_weight_unit_check CHECK (weight_unit IN ('kg', 'lbs')),
    CONSTRAINT user_profiles_distance_unit_check CHECK (distance_unit IN ('km', 'miles'))
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile_type ON user_profiles(profile_type);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE UNIQUE INDEX idx_user_profiles_one_active_per_user ON user_profiles(user_id) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE user_profiles IS 'User profiles - multiple profiles per user for different training contexts';
COMMENT ON COLUMN user_profiles.is_active IS 'Only one profile can be active per user at a time';
COMMENT ON COLUMN user_profiles.settings IS 'JSON object for profile-specific settings and preferences';

-- ============================================================================
-- EXERCISES (Simplified - only what mobile uses)
-- ============================================================================

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for exercises
CREATE INDEX idx_exercises_name ON exercises(name);

-- Comments
COMMENT ON TABLE exercises IS 'Exercise database - simplified for mobile app usage';

-- ============================================================================
-- ROUTINES (Legacy - kept for backward compatibility)
-- ============================================================================

-- Routines table - profile-specific workout plans
CREATE TABLE routines (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#4A90E2',
    duration_minutes INTEGER,
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

-- Routine exercises
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    order_in_routine INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1,
    reps INTEGER,
    weight DECIMAL(6,2),
    duration_seconds INTEGER,
    rest_time_seconds INTEGER DEFAULT 60,
    rpe INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
    notes TEXT,
    is_superset BOOLEAN DEFAULT FALSE,
    superset_group INTEGER,
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

-- Indexes for routines
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

-- Comments
COMMENT ON TABLE routines IS 'User routines - profile-specific workout plans (legacy, kept for compatibility)';
COMMENT ON COLUMN routines.profile_id IS 'Links routine to specific user profile';
COMMENT ON COLUMN routines.color IS 'Hex color for UI representation';
COMMENT ON COLUMN routine_exercises.rpe IS 'Rate of Perceived Exertion (1-10 scale)';
COMMENT ON COLUMN routine_exercises.superset_group IS 'Groups exercises that should be performed as supersets';
COMMENT ON COLUMN routine_exercises.order_in_routine IS 'Defines the order of exercises in the routine';

-- ============================================================================
-- TRAINING DAYS
-- ============================================================================

-- Training days table - stores workout day templates per profile
CREATE TABLE training_days (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_training_day_per_profile UNIQUE(profile_id, name),
    CONSTRAINT training_days_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT training_days_name_format CHECK (name ~ '^[A-Za-z0-9\s\-_áéíóúÁÉÍÓÚñÑüÜ\(\)\:\,\.\''\/]+$')
);

-- Training day exercises junction table
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

    CONSTRAINT unique_exercise_per_training_day UNIQUE(training_day_id, exercise_id),
    CONSTRAINT positive_sets CHECK (sets > 0),
    CONSTRAINT positive_reps CHECK (reps > 0),
    CONSTRAINT positive_weight CHECK (weight IS NULL OR weight > 0),
    CONSTRAINT positive_rest CHECK (rest_seconds >= 0)
);

-- Indexes for training_days
CREATE INDEX idx_training_days_profile_id ON training_days(profile_id);
CREATE INDEX idx_training_days_is_active ON training_days(is_active);
CREATE INDEX idx_training_days_name ON training_days(name);
CREATE INDEX idx_training_days_created_at ON training_days(created_at);

CREATE INDEX idx_training_day_exercises_training_day_id ON training_day_exercises(training_day_id);
CREATE INDEX idx_training_day_exercises_exercise_id ON training_day_exercises(exercise_id);
CREATE INDEX idx_training_day_exercises_order_index ON training_day_exercises(order_index);

-- Trigger for updated_at
CREATE TRIGGER update_training_days_updated_at
    BEFORE UPDATE ON training_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
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

-- ============================================================================
-- ROUTINE WEEKS (Unified Weekly Schedule + Exercise Configuration)
-- ============================================================================

CREATE TABLE routine_weeks (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    day_name VARCHAR(20) NOT NULL,
    is_rest_day BOOLEAN DEFAULT FALSE,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
    routine_name VARCHAR(100),
    training_day_id INTEGER REFERENCES training_days(id) ON DELETE SET NULL,
    exercises_config JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_day_per_profile UNIQUE(profile_id, day_of_week),
    CONSTRAINT valid_day_names CHECK (day_name IN ('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    CONSTRAINT rest_day_no_routine CHECK (NOT (is_rest_day = TRUE AND (routine_id IS NOT NULL OR routine_name IS NOT NULL))),
    CONSTRAINT rest_day_no_exercises CHECK (NOT (is_rest_day = TRUE AND jsonb_array_length(exercises_config) > 0)),
    CONSTRAINT valid_exercises_config CHECK (jsonb_typeof(exercises_config) = 'array')
);

-- Indexes for routine_weeks
CREATE INDEX idx_routine_weeks_profile_id ON routine_weeks(profile_id);
CREATE INDEX idx_routine_weeks_day_of_week ON routine_weeks(day_of_week);
CREATE INDEX idx_routine_weeks_is_rest_day ON routine_weeks(is_rest_day);
CREATE INDEX idx_routine_weeks_routine_id ON routine_weeks(routine_id);
CREATE INDEX idx_routine_weeks_routine_name ON routine_weeks(routine_name);
CREATE INDEX idx_routine_weeks_training_day_id ON routine_weeks(training_day_id);
CREATE INDEX idx_routine_weeks_exercises_config ON routine_weeks USING GIN(exercises_config);

-- Trigger for updated_at
CREATE TRIGGER update_routine_weeks_updated_at
    BEFORE UPDATE ON routine_weeks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE routine_weeks IS 'Weekly schedule configuration mapping days to routines per profile - includes unified exercise configuration';
COMMENT ON COLUMN routine_weeks.profile_id IS 'Links to user profile - each profile has independent weekly schedule';
COMMENT ON COLUMN routine_weeks.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, etc.';
COMMENT ON COLUMN routine_weeks.day_name IS 'Localized day name for display in Spanish';
COMMENT ON COLUMN routine_weeks.is_rest_day IS 'TRUE if this day is configured as rest day';
COMMENT ON COLUMN routine_weeks.routine_id IS 'Assigned routine for this day (NULL if no routine assigned)';
COMMENT ON COLUMN routine_weeks.routine_name IS 'Name of the routine assigned to this day (replaces routine_id reference)';
COMMENT ON COLUMN routine_weeks.training_day_id IS 'Optional reference to training day template used to create this configuration';
COMMENT ON COLUMN routine_weeks.exercises_config IS 'JSONB array containing complete exercise configuration: [{exercise_id, exercise_name, exercise_image, order_index, sets_config, notes}]';

-- ============================================================================
-- SESSION HISTORY
-- ============================================================================

CREATE TABLE session_history (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_uuid VARCHAR(100) NOT NULL,
    routine_name VARCHAR(255) NOT NULL,
    day_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'cancelled')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    session_data JSONB NOT NULL,
    notes TEXT,
    total_exercises INTEGER DEFAULT 0,
    completed_exercises INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    completed_sets INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT session_history_unique_profile_date UNIQUE(profile_id, session_date),
    CONSTRAINT session_history_duration_minutes_check CHECK (duration_minutes > 0),
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

-- Indexes for session_history
CREATE INDEX idx_session_history_profile_id ON session_history(profile_id);
CREATE INDEX idx_session_history_session_date ON session_history(session_date);
CREATE INDEX idx_session_history_status ON session_history(status);
CREATE INDEX idx_session_history_profile_date ON session_history(profile_id, session_date);
CREATE INDEX idx_session_history_session_data ON session_history USING GIN(session_data);
CREATE INDEX idx_session_history_created_at ON session_history(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_session_history_updated_at
    BEFORE UPDATE ON session_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE session_history IS 'Historical record of completed workout sessions per profile';
COMMENT ON COLUMN session_history.profile_id IS 'Reference to user profile who performed the session';
COMMENT ON COLUMN session_history.session_date IS 'Date when the session occurred (not when it was recorded)';
COMMENT ON COLUMN session_history.session_uuid IS 'Original UUID from AsyncStorage for tracking';
COMMENT ON COLUMN session_history.routine_name IS 'Name of the routine that was performed';
COMMENT ON COLUMN session_history.day_name IS 'Name of the day (e.g., "Lunes", "Martes")';
COMMENT ON COLUMN session_history.status IS 'Session final status: completed or cancelled';
COMMENT ON COLUMN session_history.session_data IS 'Complete exercise and set data stored as JSONB - independent of other tables';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
