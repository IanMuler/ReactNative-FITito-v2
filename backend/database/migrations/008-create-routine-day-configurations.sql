-- Migration 008: Create routine day configurations table
-- Stores detailed exercise configurations for specific routine week days

-- Routine day configurations table - detailed exercise setup per day
CREATE TABLE routine_day_configurations (
    id SERIAL PRIMARY KEY,
    routine_week_id INTEGER NOT NULL REFERENCES routine_weeks(id) ON DELETE CASCADE,
    training_day_id INTEGER NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL, -- Store for history/display
    exercise_image VARCHAR(500), -- Store for display
    order_index INTEGER NOT NULL,
    sets_config JSONB NOT NULL DEFAULT '[]', -- Array of set configurations
    notes TEXT, -- Exercise-specific notes for this day
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_order_index CHECK (order_index >= 0),
    CONSTRAINT unique_exercise_order_per_day UNIQUE(routine_week_id, order_index),
    CONSTRAINT valid_sets_config CHECK (jsonb_typeof(sets_config) = 'array')
);

-- Indexes for performance
CREATE INDEX idx_routine_day_configs_routine_week_id ON routine_day_configurations(routine_week_id);
CREATE INDEX idx_routine_day_configs_training_day_id ON routine_day_configurations(training_day_id);
CREATE INDEX idx_routine_day_configs_exercise_id ON routine_day_configurations(exercise_id);
CREATE INDEX idx_routine_day_configs_order ON routine_day_configurations(routine_week_id, order_index);

-- Trigger for updated_at
CREATE TRIGGER update_routine_day_configurations_updated_at 
    BEFORE UPDATE ON routine_day_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize routine day configuration from training day
CREATE OR REPLACE FUNCTION initialize_routine_day_configuration(
    target_routine_week_id INTEGER,
    target_training_day_id INTEGER
) RETURNS VOID AS $$
DECLARE
    exercise_record RECORD;
    default_set_config JSONB;
BEGIN
    -- Clear existing configurations for this routine week
    DELETE FROM routine_day_configurations 
    WHERE routine_week_id = target_routine_week_id;
    
    -- Create configurations based on training day exercises
    FOR exercise_record IN 
        SELECT 
            tde.exercise_id,
            tde.order_index,
            tde.sets,
            tde.reps,
            tde.weight,
            tde.rest_seconds,
            tde.notes,
            e.name as exercise_name,
            e.image as exercise_image
        FROM training_day_exercises tde
        JOIN exercises e ON tde.exercise_id = e.id
        WHERE tde.training_day_id = target_training_day_id
        ORDER BY tde.order_index
    LOOP
        -- Create default set configuration based on training day template
        default_set_config := jsonb_build_array();
        
        -- Add sets based on template (default sets count from training day)
        FOR i IN 1..COALESCE(exercise_record.sets, 3) LOOP
            default_set_config := default_set_config || jsonb_build_array(
                jsonb_build_object(
                    'reps', COALESCE(exercise_record.reps::text, ''),
                    'weight', COALESCE(exercise_record.weight::text, ''),
                    'rir', '',
                    'rp', '[]'::jsonb,
                    'ds', '[]'::jsonb,
                    'partials', null
                )
            );
        END LOOP;
        
        -- Insert configuration
        INSERT INTO routine_day_configurations (
            routine_week_id,
            training_day_id,
            exercise_id,
            exercise_name,
            exercise_image,
            order_index,
            sets_config,
            notes
        ) VALUES (
            target_routine_week_id,
            target_training_day_id,
            exercise_record.exercise_id,
            exercise_record.exercise_name,
            exercise_record.exercise_image,
            exercise_record.order_index,
            default_set_config,
            exercise_record.notes
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get routine day configuration with exercises
CREATE OR REPLACE FUNCTION get_routine_day_configuration(target_routine_week_id INTEGER)
RETURNS TABLE (
    config_id INTEGER,
    routine_week_id INTEGER,
    training_day_id INTEGER,
    exercise_id INTEGER,
    exercise_name VARCHAR(255),
    exercise_image VARCHAR(500),
    order_index INTEGER,
    sets_config JSONB,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rdc.id,
        rdc.routine_week_id,
        rdc.training_day_id,
        rdc.exercise_id,
        rdc.exercise_name,
        rdc.exercise_image,
        rdc.order_index,
        rdc.sets_config,
        rdc.notes
    FROM routine_day_configurations rdc
    WHERE rdc.routine_week_id = target_routine_week_id
    ORDER BY rdc.order_index;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE routine_day_configurations IS 'Detailed exercise configurations for specific routine week days';
COMMENT ON COLUMN routine_day_configurations.routine_week_id IS 'Links to specific day in routine week';
COMMENT ON COLUMN routine_day_configurations.training_day_id IS 'Source training day template';
COMMENT ON COLUMN routine_day_configurations.sets_config IS 'JSON array of set configurations: [{reps, weight, rir, rp, ds, partials}]';
COMMENT ON COLUMN routine_day_configurations.order_index IS 'Exercise order in the routine day (0-based)';

COMMENT ON FUNCTION initialize_routine_day_configuration IS 'Initializes routine day configuration from training day template';
COMMENT ON FUNCTION get_routine_day_configuration IS 'Gets complete configuration for a routine week day';

-- Example sets_config structure:
-- [
--   {
--     "reps": "12",
--     "weight": "80",
--     "rir": "2",
--     "rp": [{"value": "8", "time": 15}, {"value": "4", "time": 15}],
--     "ds": [{"reps": "8", "peso": "60"}, {"reps": "6", "peso": "40"}],
--     "partials": {"reps": "5"}
--   },
--   {
--     "reps": "10",
--     "weight": "80",
--     "rir": "1",
--     "rp": [],
--     "ds": [],
--     "partials": null
--   }
-- ]