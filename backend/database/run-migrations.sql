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
    (SELECT count(*) FROM routines) as total_routines;