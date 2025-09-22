-- Seed 002: Demo users and profiles for testing
-- Recreates the Ian/Meli profile system from original app

-- Demo user (email: demo@fitito.com, password: demo123)
-- Password hash for 'demo123' using bcrypt
INSERT INTO users (email, password_hash, email_verified) VALUES
('demo@fitito.com', '$2b$10$mXVaIAVq8LPqKpF1QYm0/.FO0C6FfHqMOPYvBbO8T7qE8bY0w6I0K', true);

-- Get the user ID for the demo user
DO $$
DECLARE
    demo_user_id INTEGER;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@fitito.com';
    
    -- Create Ian profile (active by default)
    INSERT INTO user_profiles (
        user_id, 
        profile_name, 
        display_name, 
        profile_type, 
        is_active,
        bio,
        weight_unit,
        distance_unit,
        settings
    ) VALUES (
        demo_user_id,
        'Ian',
        'Ian Muler',
        'personal',
        true,
        'Focused on strength training and compound movements',
        'kg',
        'km',
        '{"theme": "dark", "notifications": true, "autoStartTimer": false}'
    );
    
    -- Create Meli profile (inactive)
    INSERT INTO user_profiles (
        user_id, 
        profile_name, 
        display_name, 
        profile_type, 
        is_active,
        bio,
        weight_unit,
        distance_unit,
        settings
    ) VALUES (
        demo_user_id,
        'Meli',
        'Melina Rodriguez',
        'personal',
        false,
        'Love cardio and functional training',
        'kg',
        'km',
        '{"theme": "light", "notifications": true, "autoStartTimer": true}'
    );
END $$;

-- Create sample routines for Ian profile
DO $$
DECLARE
    ian_profile_id INTEGER;
    routine_id INTEGER;
BEGIN
    SELECT id INTO ian_profile_id 
    FROM user_profiles 
    WHERE profile_name = 'Ian' 
    AND user_id = (SELECT id FROM users WHERE email = 'demo@fitito.com');
    
    -- Ian's Upper Body Routine
    INSERT INTO routines (
        profile_id, 
        name, 
        description, 
        color, 
        duration_minutes, 
        difficulty_level,
        is_favorite,
        tags
    ) VALUES (
        ian_profile_id,
        'Upper Body Strength',
        'Focus on chest, back, and shoulders with compound movements',
        '#FF6B6B',
        75,
        4,
        true,
        ARRAY['strength', 'upper body', 'compound']
    ) RETURNING id INTO routine_id;
    
    -- Add exercises to Ian's upper body routine
    INSERT INTO routine_exercises (
        routine_id, exercise_id, order_in_routine, sets, reps, weight, rest_time_seconds
    ) VALUES
    (routine_id, (SELECT id FROM exercises WHERE name = 'Bench Press'), 1, 4, 8, 80.0, 180),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Bent-over Row'), 2, 4, 8, 70.0, 180),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Overhead Press'), 3, 3, 10, 50.0, 150),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Pull-ups'), 4, 3, 8, NULL, 120),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Dips'), 5, 3, 12, NULL, 90);
    
    -- Ian's Leg Day Routine
    INSERT INTO routines (
        profile_id, 
        name, 
        description, 
        color, 
        duration_minutes, 
        difficulty_level,
        tags
    ) VALUES (
        ian_profile_id,
        'Leg Day Power',
        'Heavy compound leg movements for strength and size',
        '#4ECDC4',
        90,
        5,
        ARRAY['strength', 'legs', 'power']
    ) RETURNING id INTO routine_id;
    
    -- Add exercises to Ian's leg routine
    INSERT INTO routine_exercises (
        routine_id, exercise_id, order_in_routine, sets, reps, weight, rest_time_seconds
    ) VALUES
    (routine_id, (SELECT id FROM exercises WHERE name = 'Squats'), 1, 5, 5, 120.0, 240),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Romanian Deadlift'), 2, 4, 8, 100.0, 180),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Lunges'), 3, 3, 12, 25.0, 90);
END $$;

-- Create sample routines for Meli profile  
DO $$
DECLARE
    meli_profile_id INTEGER;
    routine_id INTEGER;
BEGIN
    SELECT id INTO meli_profile_id 
    FROM user_profiles 
    WHERE profile_name = 'Meli' 
    AND user_id = (SELECT id FROM users WHERE email = 'demo@fitito.com');
    
    -- Meli's Cardio HIIT
    INSERT INTO routines (
        profile_id, 
        name, 
        description, 
        color, 
        duration_minutes, 
        difficulty_level,
        is_favorite,
        tags
    ) VALUES (
        meli_profile_id,
        'HIIT Cardio Blast',
        'High-intensity interval training for fat burn',
        '#FFD93D',
        30,
        3,
        true,
        ARRAY['cardio', 'hiit', 'fat burn']
    ) RETURNING id INTO routine_id;
    
    -- Add exercises to Meli's HIIT routine
    INSERT INTO routine_exercises (
        routine_id, exercise_id, order_in_routine, sets, duration_seconds, rest_time_seconds
    ) VALUES
    (routine_id, (SELECT id FROM exercises WHERE name = 'Jumping Jacks'), 1, 4, 30, 30),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Burpees'), 2, 4, 20, 40),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Mountain Climbers'), 3, 4, 30, 30),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Bodyweight Squats'), 4, 4, 45, 15);
    
    -- Meli's Functional Training
    INSERT INTO routines (
        profile_id, 
        name, 
        description, 
        color, 
        duration_minutes, 
        difficulty_level,
        tags
    ) VALUES (
        meli_profile_id,
        'Functional Flow',
        'Bodyweight functional movements for everyday strength',
        '#A8E6CF',
        45,
        2,
        ARRAY['functional', 'bodyweight', 'flexibility']
    ) RETURNING id INTO routine_id;
    
    -- Add exercises to Meli's functional routine
    INSERT INTO routine_exercises (
        routine_id, exercise_id, order_in_routine, sets, reps, rest_time_seconds
    ) VALUES
    (routine_id, (SELECT id FROM exercises WHERE name = 'Push-ups'), 1, 3, 15, 60),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Lunges'), 2, 3, 20, 60),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Plank'), 3, 3, NULL, 60),
    (routine_id, (SELECT id FROM exercises WHERE name = 'Russian Twists'), 4, 3, 30, 45);
    
    -- Update plank to use duration instead of reps
    UPDATE routine_exercises 
    SET duration_seconds = 45, reps = NULL 
    WHERE routine_id = routine_id 
    AND exercise_id = (SELECT id FROM exercises WHERE name = 'Plank');
END $$;