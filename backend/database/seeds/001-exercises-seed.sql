-- Seed 001: Basic exercises for FITito
-- Global exercises available to all profiles

-- Chest exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Push-ups', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['none'], 
 ARRAY['Start in plank position', 'Lower body to ground', 'Push back up', 'Repeat'],
 'Classic bodyweight chest exercise', 2, true, true),

('Bench Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'],
 ARRAY['Lie on bench', 'Grip bar wider than shoulders', 'Lower to chest', 'Press up'],
 'Fundamental compound chest movement', 3, true, false),

('Incline Dumbbell Press', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['dumbbells', 'incline bench'],
 ARRAY['Set bench to 30-45 degrees', 'Hold dumbbells at chest level', 'Press up and slightly together', 'Lower with control'],
 'Upper chest focused pressing movement', 3, true, false),

('Dips', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dip bars'],
 ARRAY['Grab dip bars', 'Lean forward slightly', 'Lower body', 'Push back up'],
 'Compound bodyweight exercise', 4, true, true);

-- Back exercises  
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Pull-ups', 'back', ARRAY['back', 'biceps'], ARRAY['pull-up bar'],
 ARRAY['Hang from bar', 'Pull body up', 'Chin over bar', 'Lower with control'],
 'Ultimate bodyweight back exercise', 4, true, true),

('Deadlift', 'back', ARRAY['back', 'glutes', 'hamstrings', 'traps'], ARRAY['barbell'],
 ARRAY['Stand with feet hip-width', 'Bend at hips and knees', 'Grip bar', 'Stand up straight'],
 'King of all exercises', 5, true, false),

('Bent-over Row', 'back', ARRAY['back', 'biceps', 'rear delts'], ARRAY['barbell'],
 ARRAY['Bend forward at hips', 'Hold bar with overhand grip', 'Pull bar to lower chest', 'Lower with control'],
 'Classic horizontal pulling movement', 3, true, false),

('Lat Pulldown', 'back', ARRAY['back', 'biceps'], ARRAY['lat pulldown machine'],
 ARRAY['Sit at machine', 'Grab bar wider than shoulders', 'Pull bar to chest', 'Return to start'],
 'Machine-based vertical pull', 2, true, false);

-- Leg exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Squats', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['barbell', 'squat rack'],
 ARRAY['Stand with feet shoulder-width', 'Lower into squat', 'Thighs parallel to ground', 'Stand back up'],
 'Fundamental leg exercise', 3, true, false),

('Bodyweight Squats', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['none'],
 ARRAY['Stand with feet shoulder-width', 'Lower into squat', 'Thighs parallel to ground', 'Stand back up'],
 'Bodyweight version of squats', 1, true, true),

('Lunges', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['none'],
 ARRAY['Step forward with one leg', 'Lower back knee toward ground', 'Push back to start', 'Alternate legs'],
 'Unilateral leg exercise', 2, true, true),

('Romanian Deadlift', 'legs', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell'],
 ARRAY['Hold bar at thigh level', 'Hinge at hips', 'Lower bar along legs', 'Return to start'],
 'Hip-hinge movement for posterior chain', 3, true, false);

-- Shoulder exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Overhead Press', 'shoulders', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell'],
 ARRAY['Hold bar at shoulder level', 'Press overhead', 'Lock out arms', 'Lower with control'],
 'Primary shoulder pressing movement', 4, true, false),

('Lateral Raises', 'shoulders', ARRAY['shoulders'], ARRAY['dumbbells'],
 ARRAY['Hold dumbbells at sides', 'Raise arms to shoulder height', 'Pause briefly', 'Lower slowly'],
 'Isolation exercise for side delts', 2, false, false),

('Pike Push-ups', 'shoulders', ARRAY['shoulders', 'triceps'], ARRAY['none'],
 ARRAY['Start in downward dog position', 'Lower head toward ground', 'Push back up', 'Keep hips high'],
 'Bodyweight shoulder exercise', 3, false, true);

-- Arm exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Bicep Curls', 'arms', ARRAY['biceps'], ARRAY['dumbbells'],
 ARRAY['Hold weights at sides', 'Curl up to shoulders', 'Squeeze biceps', 'Lower slowly'],
 'Classic bicep isolation', 1, false, false),

('Tricep Dips', 'arms', ARRAY['triceps'], ARRAY['bench'],
 ARRAY['Sit on edge of bench', 'Place hands beside hips', 'Lower body', 'Push back up'],
 'Bodyweight tricep exercise', 2, false, true),

('Close-grip Push-ups', 'arms', ARRAY['triceps', 'chest'], ARRAY['none'],
 ARRAY['Start in push-up position', 'Place hands close together', 'Lower body', 'Push back up'],
 'Tricep-focused push-up variation', 3, false, true);

-- Core exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Plank', 'core', ARRAY['core', 'shoulders'], ARRAY['none'],
 ARRAY['Start in push-up position', 'Hold on forearms', 'Keep body straight', 'Breathe normally'],
 'Isometric core strengthener', 2, false, true),

('Crunches', 'core', ARRAY['core'], ARRAY['none'],
 ARRAY['Lie on back', 'Knees bent', 'Lift shoulders off ground', 'Lower slowly'],
 'Basic abdominal exercise', 1, false, true),

('Mountain Climbers', 'core', ARRAY['core', 'shoulders'], ARRAY['none'],
 ARRAY['Start in plank position', 'Bring knee to chest', 'Quickly switch legs', 'Keep core tight'],
 'Dynamic core and cardio exercise', 3, true, true),

('Russian Twists', 'core', ARRAY['core', 'obliques'], ARRAY['none'],
 ARRAY['Sit with knees bent', 'Lean back slightly', 'Rotate torso side to side', 'Keep core engaged'],
 'Rotational core exercise', 2, false, true);

-- Cardio exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, description, difficulty_level, is_compound, is_bodyweight) VALUES
('Running', 'cardio', ARRAY['legs', 'cardiovascular'], ARRAY['none'],
 ARRAY['Start at comfortable pace', 'Maintain steady rhythm', 'Land on midfoot', 'Keep posture upright'],
 'Classic cardiovascular exercise', 2, true, true),

('Jumping Jacks', 'cardio', ARRAY['legs', 'shoulders', 'cardiovascular'], ARRAY['none'],
 ARRAY['Start with feet together', 'Jump feet apart while raising arms', 'Jump back to start', 'Repeat quickly'],
 'Full-body cardio movement', 1, true, true),

('Burpees', 'cardio', ARRAY['full body', 'cardiovascular'], ARRAY['none'],
 ARRAY['Start standing', 'Drop to squat', 'Kick feet back to plank', 'Jump back to squat', 'Jump up'],
 'High-intensity full-body exercise', 4, true, true);