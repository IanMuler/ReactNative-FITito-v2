-- Migration 012: Fix training days name format constraint
-- Relaxes the overly restrictive regex to allow common characters

-- Drop the existing restrictive constraint
ALTER TABLE training_days 
DROP CONSTRAINT IF EXISTS training_days_name_format;

-- Add a more permissive constraint that allows common characters
-- Allows: letters, numbers, spaces, hyphens, underscores, accented characters,
--         parentheses, colons, commas, periods, apostrophes, forward slashes
ALTER TABLE training_days 
ADD CONSTRAINT training_days_name_format 
CHECK (name ~ '^[A-Za-z0-9\s\-_áéíóúÁÉÍÓÚñÑüÜ\(\)\:\,\.\''\/]+$');

-- Update table comment to reflect the change
COMMENT ON CONSTRAINT training_days_name_format ON training_days IS 
'Allows letters, numbers, spaces, hyphens, underscores, accented characters, parentheses, colons, commas, periods, apostrophes, and forward slashes';

-- Log the migration completion
SELECT 'Migration 012: Training days name constraint updated successfully' as migration_status;