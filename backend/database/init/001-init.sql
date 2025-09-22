-- FITito Database Initialization Script
-- This script sets up the initial database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE profile_type AS ENUM ('personal', 'trainer', 'athlete');
CREATE TYPE exercise_category AS ENUM (
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 
  'cardio', 'flexibility', 'functional', 'olympic'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions to fitito_user
GRANT ALL PRIVILEGES ON DATABASE fitito_dev TO fitito_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fitito_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fitito_user;

-- Create initial admin user for database management
-- (This will be replaced by proper user management later)
INSERT INTO pg_roles (rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolpassword)
SELECT 'fitito_admin', false, false, false, true, false, md5('admin_password_change_me')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fitito_admin');

COMMENT ON DATABASE fitito_dev IS 'FITito v2.0 Development Database with Profile System';