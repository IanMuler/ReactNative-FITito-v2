-- Migration 002: Create exercises table (GLOBAL - no profile_id)
-- Ejercicios compartidos entre todos los perfiles

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

-- Indexes for performance
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

-- Comments for documentation
COMMENT ON TABLE exercises IS 'Global exercise database - shared across all user profiles';
COMMENT ON COLUMN exercises.muscle_groups IS 'Array of primary muscle groups targeted by the exercise';
COMMENT ON COLUMN exercises.equipment IS 'Array of equipment needed for the exercise';
COMMENT ON COLUMN exercises.instructions IS 'Step-by-step instructions for performing the exercise';
COMMENT ON COLUMN exercises.is_compound IS 'Whether this is a compound movement (works multiple muscle groups)';
COMMENT ON COLUMN exercises.is_bodyweight IS 'Whether this exercise uses only bodyweight';
COMMENT ON COLUMN exercises.difficulty_level IS 'Difficulty from 1 (beginner) to 5 (expert)';
COMMENT ON COLUMN exercises.created_by_admin IS 'Whether this exercise was created by system admin (vs user-created)';