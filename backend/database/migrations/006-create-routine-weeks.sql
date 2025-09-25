-- Migration 006: Create routine weeks and related tables
-- Maps days of the week to routines for each profile (Lunes→Push, Martes→Rest, etc.)

-- Routine weeks table - weekly schedule configuration per profile
CREATE TABLE routine_weeks (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
    day_name VARCHAR(20) NOT NULL, -- "Lunes", "Martes", etc. for display
    is_rest_day BOOLEAN DEFAULT FALSE,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL, -- NULL when no routine assigned
    completed_date DATE, -- Date when this day was last completed (YYYY-MM-DD)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: unique day per profile (each profile has their own weekly schedule)
    CONSTRAINT unique_day_per_profile UNIQUE(profile_id, day_of_week),
    CONSTRAINT valid_day_names CHECK (day_name IN ('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    -- Rest days cannot have assigned routines
    CONSTRAINT rest_day_no_routine CHECK (NOT (is_rest_day = TRUE AND routine_id IS NOT NULL))
);

-- Indexes for performance
CREATE INDEX idx_routine_weeks_profile_id ON routine_weeks(profile_id);
CREATE INDEX idx_routine_weeks_day_of_week ON routine_weeks(day_of_week);
CREATE INDEX idx_routine_weeks_routine_id ON routine_weeks(routine_id);
CREATE INDEX idx_routine_weeks_completed_date ON routine_weeks(completed_date);
CREATE INDEX idx_routine_weeks_is_rest_day ON routine_weeks(is_rest_day);

-- Triggers for updated_at
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
    -- Create default 7-day schedule for profile
    FOR day_index IN 0..6 LOOP
        INSERT INTO routine_weeks (profile_id, day_of_week, day_name, is_rest_day)
        VALUES (target_profile_id, day_index, day_names[day_index + 1], FALSE)
        ON CONFLICT (profile_id, day_of_week) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Initialize default schedule for existing profiles
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT id FROM user_profiles LOOP
        PERFORM initialize_default_week_schedule(profile_record.id);
    END LOOP;
END $$;

-- Comments for documentation
COMMENT ON TABLE routine_weeks IS 'Weekly schedule configuration mapping days to routines per profile';
COMMENT ON COLUMN routine_weeks.profile_id IS 'Links to user profile - each profile has independent weekly schedule';
COMMENT ON COLUMN routine_weeks.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, etc.';
COMMENT ON COLUMN routine_weeks.day_name IS 'Localized day name for display in Spanish';
COMMENT ON COLUMN routine_weeks.is_rest_day IS 'TRUE if this day is configured as rest day';
COMMENT ON COLUMN routine_weeks.routine_id IS 'Assigned routine for this day (NULL if no routine assigned)';
COMMENT ON COLUMN routine_weeks.completed_date IS 'Date when this day was last completed (for tracking progress)';
COMMENT ON FUNCTION initialize_default_week_schedule IS 'Creates default 7-day schedule for a profile';