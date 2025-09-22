-- Migration 001: Create users and user_profiles tables
-- Sistema de perfiles intercambiables para FITito

-- Users table (base authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User profiles table (switchable profiles per user)
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    profile_type profile_type DEFAULT 'personal',
    is_active BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    weight_unit VARCHAR(10) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
    distance_unit VARCHAR(10) DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_profiles_unique_name_per_user UNIQUE(user_id, profile_name),
    CONSTRAINT user_profiles_name_length CHECK (char_length(profile_name) >= 2),
    CONSTRAINT user_profiles_name_format CHECK (profile_name ~* '^[A-Za-z0-9_-]+$')
);

-- Ensure only one active profile per user
CREATE UNIQUE INDEX idx_user_profiles_one_active_per_user 
ON user_profiles (user_id) 
WHERE is_active = TRUE;

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_profile_type ON user_profiles(profile_type);

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Base user accounts for authentication';
COMMENT ON TABLE user_profiles IS 'Switchable profiles per user - core feature for profile system';
COMMENT ON COLUMN user_profiles.is_active IS 'Only one profile can be active per user at a time';
COMMENT ON COLUMN user_profiles.settings IS 'JSON object for profile-specific settings and preferences';