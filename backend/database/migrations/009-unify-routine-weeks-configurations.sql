-- Migration 009: Unify routine_weeks with routine_day_configurations
-- Consolidates the separated routine management into a single coherent table

-- Step 1: Create backup of existing data
CREATE TABLE routine_day_configurations_backup AS 
SELECT * FROM routine_day_configurations;

-- Step 2: Add new columns to routine_weeks
ALTER TABLE routine_weeks 
ADD COLUMN routine_name VARCHAR(100),
ADD COLUMN training_day_id INTEGER REFERENCES training_days(id) ON DELETE SET NULL,
ADD COLUMN exercises_config JSONB DEFAULT '[]';

-- Step 3: Migrate data from routine_day_configurations to routine_weeks
DO $$
DECLARE
    config_record RECORD;
    exercises_array JSONB := '[]';
    exercise_obj JSONB;
BEGIN
    -- Process each routine_week that has configurations
    FOR config_record IN 
        SELECT DISTINCT routine_week_id 
        FROM routine_day_configurations 
        ORDER BY routine_week_id
    LOOP
        -- Build exercises array for this routine week
        exercises_array := '[]';
        
        -- Build exercises array from configurations
        SELECT jsonb_agg(
            jsonb_build_object(
                'exercise_id', exercise_id,
                'exercise_name', exercise_name,
                'exercise_image', exercise_image,
                'order_index', order_index,
                'sets_config', sets_config,
                'notes', COALESCE(notes, '')
            ) ORDER BY order_index
        ) INTO exercises_array
        FROM routine_day_configurations 
        WHERE routine_week_id = config_record.routine_week_id;
        
        -- Update routine_weeks with consolidated data
        UPDATE routine_weeks 
        SET 
            routine_name = 'Entreno configurado',
            training_day_id = (
                SELECT DISTINCT training_day_id 
                FROM routine_day_configurations 
                WHERE routine_week_id = config_record.routine_week_id 
                LIMIT 1
            ),
            exercises_config = exercises_array
        WHERE id = config_record.routine_week_id;
        
        RAISE NOTICE 'Migrated routine_week_id % with % exercises', 
            config_record.routine_week_id, 
            jsonb_array_length(exercises_array);
    END LOOP;
END $$;

-- Step 4: Add constraints and indexes for new structure
ALTER TABLE routine_weeks 
ADD CONSTRAINT valid_exercises_config CHECK (jsonb_typeof(exercises_config) = 'array'),
ADD CONSTRAINT rest_day_no_exercises CHECK (
    NOT (is_rest_day = TRUE AND jsonb_array_length(exercises_config) > 0)
);

-- Update existing constraint to include routine_name
ALTER TABLE routine_weeks 
DROP CONSTRAINT IF EXISTS rest_day_no_routine,
ADD CONSTRAINT rest_day_no_routine CHECK (
    NOT (is_rest_day = TRUE AND (routine_id IS NOT NULL OR routine_name IS NOT NULL))
);

-- Add indexes for new columns
CREATE INDEX idx_routine_weeks_routine_name ON routine_weeks(routine_name);
CREATE INDEX idx_routine_weeks_training_day_id ON routine_weeks(training_day_id);
CREATE INDEX idx_routine_weeks_exercises_config ON routine_weeks USING gin(exercises_config);

-- Step 5: Verification query
DO $$
DECLARE
    total_migrated INTEGER;
    total_original INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_original FROM routine_day_configurations_backup;
    
    SELECT SUM(jsonb_array_length(exercises_config)) INTO total_migrated 
    FROM routine_weeks 
    WHERE exercises_config != '[]';
    
    RAISE NOTICE 'Migration verification: Original configs: %, Migrated exercises: %', 
        total_original, COALESCE(total_migrated, 0);
        
    IF total_original != COALESCE(total_migrated, 0) THEN
        RAISE EXCEPTION 'Migration verification failed: count mismatch';
    END IF;
END $$;

-- Step 6: Create helper functions for the new structure

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
    -- Get current exercises
    SELECT exercises_config INTO current_exercises 
    FROM routine_weeks 
    WHERE id = target_routine_week_id;
    
    -- Calculate next order index
    IF jsonb_array_length(current_exercises) > 0 THEN
        SELECT MAX((exercise->>'order_index')::integer) INTO max_order
        FROM jsonb_array_elements(current_exercises) AS exercise;
    END IF;
    
    -- Build new exercise object
    new_exercise := jsonb_build_object(
        'exercise_id', target_exercise_id,
        'exercise_name', target_exercise_name,
        'exercise_image', target_exercise_image,
        'order_index', max_order + 1,
        'sets_config', target_sets_config,
        'notes', COALESCE(target_notes, '')
    );
    
    -- Add exercise to array
    current_exercises := current_exercises || new_exercise;
    
    -- Update routine week
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

-- Comments for documentation
COMMENT ON COLUMN routine_weeks.routine_name IS 'Name of the routine assigned to this day (replaces routine_id reference)';
COMMENT ON COLUMN routine_weeks.training_day_id IS 'Optional reference to training day template used to create this configuration';
COMMENT ON COLUMN routine_weeks.exercises_config IS 'JSONB array containing complete exercise configuration for this day';

COMMENT ON FUNCTION add_exercise_to_routine_week IS 'Adds a single exercise to routine week configuration';
COMMENT ON FUNCTION update_routine_week_exercises IS 'Updates complete exercises configuration for routine week';
COMMENT ON FUNCTION clear_routine_week_configuration IS 'Clears all configuration from routine week';

-- Step 7: Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed successfully!';
    RAISE NOTICE 'routine_weeks table now contains unified routine and configuration data';
    RAISE NOTICE 'routine_day_configurations table can be dropped after verification';
    RAISE NOTICE 'Backup table routine_day_configurations_backup created for safety';
END $$;