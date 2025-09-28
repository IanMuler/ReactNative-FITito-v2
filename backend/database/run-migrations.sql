-- Run all migrations and seeds for FITito database setup
-- Execute this file to set up the complete database schema

\echo 'Starting FITito database setup...'

-- Run migrations in order
\echo 'Running migration 001: Users and Profiles...'
\i migrations/001-create-users-and-profiles.sql

\echo 'Running migration 002: Exercises...'
\i migrations/002-create-exercises.sql

\echo 'Running migration 003: Routines...'
\i migrations/003-create-routines.sql

\echo 'Running migration 004: Workout Sessions...'
\i migrations/004-create-workout-sessions.sql

\echo 'Running migration 005: Training Days...'
\i migrations/005-create-training-days.sql

\echo 'Running migration 006: Routine Weeks...'
\i migrations/006-create-routine-weeks.sql

\echo 'Running migration 007: Workout Sessions...'
\i migrations/007-create-workout-sessions.sql

\echo 'Running migration 008: Routine Day Configurations...'
\i migrations/008-create-routine-day-configurations.sql

\echo 'Running migration 009: Unify Routine Weeks Configurations...'
\i migrations/009-unify-routine-weeks-configurations.sql

\echo 'Running migration 010: Training Sessions...'
\i migrations/010-create-training-sessions.sql

\echo 'Running migration 011: Fix Complete Training Session Function...'
\i migrations/011-fix-complete-training-session.sql

\echo 'Running migration 012: Fix Training Days Name Constraint...'
\i migrations/012-fix-training-days-name-constraint.sql

-- Run seeds
\echo 'Running seed 001: Exercises...'
\i seeds/001-exercises-seed.sql

\echo 'Running seed 002: Demo Users...'
\i seeds/002-demo-users-seed.sql

\echo 'Database setup completed successfully!'

-- Show summary
SELECT 
    'Setup Summary' as info,
    (SELECT count(*) FROM exercises) as total_exercises,
    (SELECT count(*) FROM users) as total_users,
    (SELECT count(*) FROM user_profiles) as total_profiles,
    (SELECT count(*) FROM routines) as total_routines,
    (SELECT count(*) FROM training_days) as total_training_days;