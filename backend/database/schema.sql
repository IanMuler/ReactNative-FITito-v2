-- ============================================================================
-- FITito Database Schema - Consolidated Version
-- ============================================================================
-- This file contains the complete database schema for the FITito application.
-- Created from consolidation of 15 incremental migrations.
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f schema.sql
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE profile_type AS ENUM ('personal', 'shared');

CREATE TYPE exercise_category AS ENUM (
    'strength',
    'cardio',
    'flexibility',
    'balance',
    'plyometrics',
    'powerlifting',
    'olympic_weightlifting',
    'calisthenics',
    'crossfit',
    'functional',
    'rehabilitation',
    'sports_specific'
);

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
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- User profiles table - multiple profiles per user (e.g., different training personas)
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    profile_type profile_type DEFAULT 'personal',
    avatar_url TEXT,
    bio TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT user_profiles_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT user_profiles_unique_name_per_user UNIQUE(user_id, name)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile_type ON user_profiles(profile_type);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE user_profiles IS 'User profiles - multiple profiles per user for different training contexts';
COMMENT ON COLUMN user_profiles.settings IS 'JSONB object containing user preferences, units, notifications, etc.';

-- ============================================================================
-- EXERCISES (Global Exercise Database)
-- ============================================================================

-- Exercises table - shared across all user profiles
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category exercise_category NOT NULL,
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    instructions TEXT[] DEFAULT '{}',
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_compound BOOLEAN DEFAULT FALSE,
    is_bodyweight BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    image_url TEXT,
    tips TEXT[] DEFAULT '{}',
    common_mistakes TEXT[] DEFAULT '{}',
    variations TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by_admin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT exercises_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT exercises_muscle_groups_not_empty CHECK (array_length(muscle_groups, 1) > 0),
    CONSTRAINT exercises_valid_video_url CHECK (video_url IS NULL OR video_url ~* '^https?://.*'),
    CONSTRAINT exercises_valid_image_url CHECK (image_url IS NULL OR image_url ~* '^https?://.*')
);

-- Indexes for exercises
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_exercises_is_compound ON exercises(is_compound);
CREATE INDEX idx_exercises_is_bodyweight ON exercises(is_bodyweight);
CREATE INDEX idx_exercises_is_active ON exercises(is_active);
CREATE INDEX idx_exercises_name_search ON exercises USING GIN(to_tsvector('english', name));

-- Full text search index
CREATE INDEX idx_exercises_full_text_search ON exercises
USING GIN(to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(muscle_groups, ' '), '') || ' ' ||
    coalesce(array_to_string(equipment, ' '), '')
));

-- Trigger for updated_at
CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE exercises IS 'Global exercise database - shared across all user profiles';
COMMENT ON COLUMN exercises.muscle_groups IS 'Array of primary muscle groups targeted by the exercise';
COMMENT ON COLUMN exercises.equipment IS 'Array of equipment needed for the exercise';
COMMENT ON COLUMN exercises.instructions IS 'Step-by-step instructions for performing the exercise';
COMMENT ON COLUMN exercises.is_compound IS 'Whether this is a compound movement (works multiple muscle groups)';
COMMENT ON COLUMN exercises.is_bodyweight IS 'Whether this exercise uses only bodyweight';
COMMENT ON COLUMN exercises.difficulty_level IS 'Difficulty from 1 (beginner) to 5 (expert)';
COMMENT ON COLUMN exercises.created_by_admin IS 'Whether this exercise was created by system admin (vs user-created)';

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

-- Routine exercises - exercises in a routine with specific parameters
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
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
COMMENT ON TABLE routines IS 'User routines - profile-specific workout plans (legacy table, not actively used)';
COMMENT ON TABLE routine_exercises IS 'Exercises within routines with specific parameters (legacy table)';

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

-- Triggers for updated_at
CREATE TRIGGER update_training_days_updated_at
    BEFORE UPDATE ON training_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate training day has at least one exercise
CREATE OR REPLACE FUNCTION validate_training_day_has_exercises()
RETURNS TRIGGER AS $$
BEGIN
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

-- Routine weeks table - weekly schedule configuration per profile
-- This table maps days of the week to workout configurations
CREATE TABLE routine_weeks (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    day_name VARCHAR(20) NOT NULL,
    is_rest_day BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Legacy routine reference (kept for backward compatibility)
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,

    -- Unified configuration (replaces routine_day_configurations table)
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
CREATE INDEX idx_routine_weeks_routine_id ON routine_weeks(routine_id);
CREATE INDEX idx_routine_weeks_is_rest_day ON routine_weeks(is_rest_day);
CREATE INDEX idx_routine_weeks_is_active ON routine_weeks(is_active);
CREATE INDEX idx_routine_weeks_routine_name ON routine_weeks(routine_name);
CREATE INDEX idx_routine_weeks_training_day_id ON routine_weeks(training_day_id);
CREATE INDEX idx_routine_weeks_exercises_config ON routine_weeks USING GIN(exercises_config);

-- Trigger for updated_at
CREATE TRIGGER update_routine_weeks_updated_at
    BEFORE UPDATE ON routine_weeks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize default week schedule for a profile
CREATE OR REPLACE FUNCTION initialize_default_week_schedule(target_profile_id INTEGER)
RETURNS VOID AS $$
DECLARE
    day_names TEXT[] := ARRAY['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    day_index INTEGER;
BEGIN
    FOR day_index IN 0..6 LOOP
        INSERT INTO routine_weeks (profile_id, day_of_week, day_name, is_rest_day)
        VALUES (target_profile_id, day_index, day_names[day_index + 1], FALSE)
        ON CONFLICT (profile_id, day_of_week) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to add exercise to routine week
CREATE OR REPLACE FUNCTION add_exercise_to_routine_week(
    target_routine_week_id INTEGER,
    target_exercise_id INTEGER,
    target_exercise_name VARCHAR(255),
    target_exercise_image VARCHAR(500),
    target_sets_config JSONB,
    target_notes TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
    current_exercises JSONB;
    new_exercise JSONB;
    max_order INTEGER := 0;
BEGIN
    SELECT exercises_config INTO current_exercises
    FROM routine_weeks
    WHERE id = target_routine_week_id;

    IF jsonb_array_length(current_exercises) > 0 THEN
        SELECT MAX((exercise->>'order_index')::integer) INTO max_order
        FROM jsonb_array_elements(current_exercises) AS exercise;
    END IF;

    new_exercise := jsonb_build_object(
        'exercise_id', target_exercise_id,
        'exercise_name', target_exercise_name,
        'exercise_image', target_exercise_image,
        'order_index', max_order + 1,
        'sets_config', target_sets_config,
        'notes', COALESCE(target_notes, '')
    );

    current_exercises := current_exercises || new_exercise;

    UPDATE routine_weeks
    SET
        exercises_config = current_exercises,
        routine_name = CASE
            WHEN routine_name IS NULL THEN 'Entreno configurado'
            ELSE routine_name
        END
    WHERE id = target_routine_week_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update entire exercises config for routine week
CREATE OR REPLACE FUNCTION update_routine_week_exercises(
    target_routine_week_id INTEGER,
    new_exercises_config JSONB,
    new_routine_name VARCHAR(100) DEFAULT 'Entreno configurado'
) RETURNS VOID AS $$
BEGIN
    UPDATE routine_weeks
    SET
        exercises_config = new_exercises_config,
        routine_name = CASE
            WHEN jsonb_array_length(new_exercises_config) > 0 THEN new_routine_name
            ELSE NULL
        END
    WHERE id = target_routine_week_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clear routine week configuration
CREATE OR REPLACE FUNCTION clear_routine_week_configuration(target_routine_week_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE routine_weeks
    SET
        routine_name = NULL,
        training_day_id = NULL,
        exercises_config = '[]'
    WHERE id = target_routine_week_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE routine_weeks IS 'Weekly schedule configuration mapping days to routines per profile - includes unified exercise configuration';
COMMENT ON COLUMN routine_weeks.profile_id IS 'Links to user profile - each profile has independent weekly schedule';
COMMENT ON COLUMN routine_weeks.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, etc.';
COMMENT ON COLUMN routine_weeks.day_name IS 'Localized day name for display in Spanish';
COMMENT ON COLUMN routine_weeks.is_rest_day IS 'TRUE if this day is configured as rest day';
COMMENT ON COLUMN routine_weeks.is_active IS 'TRUE if this day configuration is active (added in migration 007)';
COMMENT ON COLUMN routine_weeks.routine_id IS 'Legacy: Assigned routine for this day (NULL if no routine assigned)';
COMMENT ON COLUMN routine_weeks.routine_name IS 'Name of the routine assigned to this day (replaces routine_id reference)';
COMMENT ON COLUMN routine_weeks.training_day_id IS 'Optional reference to training day template used to create this configuration';
COMMENT ON COLUMN routine_weeks.exercises_config IS 'JSONB array containing complete exercise configuration: [{exercise_id, exercise_name, exercise_image, order_index, sets_config, notes}]';
COMMENT ON FUNCTION initialize_default_week_schedule IS 'Creates default 7-day schedule for a profile';
COMMENT ON FUNCTION add_exercise_to_routine_week IS 'Adds a single exercise to routine week configuration';
COMMENT ON FUNCTION update_routine_week_exercises IS 'Updates complete exercises configuration for routine week';
COMMENT ON FUNCTION clear_routine_week_configuration IS 'Clears all configuration from routine week';

-- ============================================================================
-- SESSION HISTORY
-- ============================================================================

-- Session history table - stores completed workout sessions
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT session_history_unique_profile_date UNIQUE(profile_id, session_date),
    CONSTRAINT session_history_positive_duration CHECK (duration_minutes >= 0),
    CONSTRAINT session_history_end_after_start CHECK (end_time > start_time),
    CONSTRAINT session_history_valid_session_data CHECK (jsonb_typeof(session_data) = 'object')
);

-- Indexes for session_history
CREATE INDEX idx_session_history_profile_id ON session_history(profile_id);
CREATE INDEX idx_session_history_session_date ON session_history(session_date);
CREATE INDEX idx_session_history_status ON session_history(status);
CREATE INDEX idx_session_history_routine_name ON session_history(routine_name);
CREATE INDEX idx_session_history_session_uuid ON session_history(session_uuid);
CREATE INDEX idx_session_history_created_at ON session_history(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_session_history_updated_at
    BEFORE UPDATE ON session_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get session history for a profile
CREATE OR REPLACE FUNCTION get_session_history(
    target_profile_id INTEGER,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    profile_id INTEGER,
    session_date DATE,
    session_uuid VARCHAR(100),
    routine_name VARCHAR(255),
    day_name VARCHAR(50),
    status VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    session_data JSONB,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sh.id,
        sh.profile_id,
        sh.session_date,
        sh.session_uuid,
        sh.routine_name,
        sh.day_name,
        sh.status,
        sh.start_time,
        sh.end_time,
        sh.duration_minutes,
        sh.session_data,
        sh.notes,
        sh.created_at,
        sh.updated_at
    FROM session_history sh
    WHERE sh.profile_id = target_profile_id
    ORDER BY sh.session_date DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert session history
CREATE OR REPLACE FUNCTION upsert_session_history(
    p_profile_id INTEGER,
    p_session_date DATE,
    p_session_uuid VARCHAR(100),
    p_routine_name VARCHAR(255),
    p_day_name VARCHAR(50),
    p_status VARCHAR(20),
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP,
    p_duration_minutes INTEGER,
    p_session_data JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS session_history AS $$
DECLARE
    result session_history;
BEGIN
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
        notes
    ) VALUES (
        p_profile_id,
        p_session_date,
        p_session_uuid,
        p_routine_name,
        p_day_name,
        p_status,
        p_start_time,
        p_end_time,
        p_duration_minutes,
        p_session_data,
        p_notes
    )
    ON CONFLICT (profile_id, session_date)
    DO UPDATE SET
        session_uuid = EXCLUDED.session_uuid,
        routine_name = EXCLUDED.routine_name,
        day_name = EXCLUDED.day_name,
        status = EXCLUDED.status,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        duration_minutes = EXCLUDED.duration_minutes,
        session_data = EXCLUDED.session_data,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE session_history IS 'Historical record of completed workout sessions per profile';
COMMENT ON COLUMN session_history.profile_id IS 'Reference to user profile who performed the session';
COMMENT ON COLUMN session_history.session_date IS 'Date when the session was performed (YYYY-MM-DD)';
COMMENT ON COLUMN session_history.session_uuid IS 'Unique identifier for the session';
COMMENT ON COLUMN session_history.routine_name IS 'Name of the routine that was performed';
COMMENT ON COLUMN session_history.day_name IS 'Name of the day (e.g., "Lunes", "Martes")';
COMMENT ON COLUMN session_history.status IS 'Session status: completed or cancelled';
COMMENT ON COLUMN session_history.start_time IS 'Timestamp when the session started';
COMMENT ON COLUMN session_history.end_time IS 'Timestamp when the session ended';
COMMENT ON COLUMN session_history.duration_minutes IS 'Total duration of the session in minutes';
COMMENT ON COLUMN session_history.session_data IS 'JSONB object containing complete session data including exercises, sets, reps, etc.';
COMMENT ON COLUMN session_history.notes IS 'Optional notes about the session';
COMMENT ON FUNCTION get_session_history IS 'Retrieves session history for a profile with pagination';
COMMENT ON FUNCTION upsert_session_history IS 'Inserts or updates a session history record';

-- ============================================================================
-- SCHEMA INFORMATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'FITito consolidated schema - created from 15 migrations - training sessions removed in favor of AsyncStorage';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
