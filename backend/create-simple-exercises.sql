-- Create simple exercises table that matches original project functionality
-- Only has: id, name, image, created_at

-- Drop the existing table and recreate simplified one
DROP TABLE IF EXISTS exercises CASCADE;

-- Create simplified exercises table
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create basic index on name for performance
CREATE INDEX idx_exercises_name ON exercises(name);

-- Insert some sample data that matches the original project format
INSERT INTO exercises (name, image) VALUES 
('Push-ups', 'https://example.com/pushups.jpg'),
('Pull-ups', 'https://example.com/pullups.jpg'),
('Squats', 'https://example.com/squats.jpg');