-- Migration 012: Fix table consistency - use workout_sets instead of workout_session_sets

-- Drop the existing function
DROP FUNCTION IF EXISTS complete_training_session(INTEGER);

-- Recreate function to use workout_sets table (Migration 004 schema)
CREATE OR REPLACE FUNCTION complete_training_session(session_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    training_session_record RECORD;
    new_workout_session_id INTEGER;
    exercise_record RECORD;
    progress_record RECORD;
BEGIN
    -- Get training session details
    SELECT * INTO training_session_record
    FROM training_sessions 
    WHERE id = session_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Training session % not found or not active', session_id;
    END IF;
    
    RAISE NOTICE '[DEBUG] Found training session %: profile_id=%, routine_name=%, start_time=%', 
        session_id, training_session_record.profile_id, training_session_record.routine_name, training_session_record.start_time;
    
    -- Create workout session using Migration 004 schema
    INSERT INTO workout_sessions (
        profile_id, 
        name,  -- Use 'name' instead of 'routine_name'
        started_at,  -- Use 'started_at' instead of 'start_time'
        completed_at,
        duration_minutes,
        is_completed
    ) VALUES (
        training_session_record.profile_id,
        training_session_record.routine_name,  -- Map routine_name to name
        training_session_record.start_time,
        CURRENT_TIMESTAMP,
        GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - training_session_record.start_time))/60)),
        TRUE
    ) RETURNING id INTO new_workout_session_id;
    
    RAISE NOTICE '[DEBUG] Created workout session with id=%', new_workout_session_id;
    
    -- Copy exercises and sets to workout_sets table (Migration 004 schema)
    FOR exercise_record IN 
        SELECT * FROM training_session_exercises 
        WHERE training_session_id = session_id 
        ORDER BY order_in_session
    LOOP
        RAISE NOTICE '[DEBUG] Processing exercise: id=%, name=%', 
            exercise_record.exercise_id, exercise_record.exercise_name;
        
        -- Copy sets from progress to workout_sets
        RAISE NOTICE '[DEBUG] Looking for completed sets for exercise_id=% in training_session_id=%', 
            exercise_record.exercise_id, session_id;
            
        FOR progress_record IN 
            SELECT * FROM training_session_progress 
            WHERE training_session_id = session_id 
            AND exercise_id = exercise_record.exercise_id
            AND is_completed = TRUE
            ORDER BY set_number
        LOOP
            RAISE NOTICE '[DEBUG] Found completed set: exercise_id=%, set_number=%, reps=%, weight=%, is_completed=%', 
                progress_record.exercise_id, progress_record.set_number, progress_record.reps, 
                progress_record.weight, progress_record.is_completed;
                
            INSERT INTO workout_sets (
                session_id,
                exercise_id,
                set_number,
                reps,
                weight,
                rpe,  -- Map rir to rpe (Rate of Perceived Exertion)
                notes,
                is_completed
            ) VALUES (
                new_workout_session_id,
                progress_record.exercise_id,
                progress_record.set_number,
                progress_record.reps,
                progress_record.weight,
                progress_record.rir,  -- Map rir to rpe
                progress_record.notes,
                TRUE
            );
            
            RAISE NOTICE '[DEBUG] Inserted set into workout_sets: session_id=%, exercise_id=%, set_number=%', 
                new_workout_session_id, progress_record.exercise_id, progress_record.set_number;
        END LOOP;
    END LOOP;
    
    -- Mark training session as completed
    UPDATE training_sessions 
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = session_id;
    
    RAISE NOTICE '[DEBUG] Completed training session % -> workout session %', session_id, new_workout_session_id;
    
    RETURN new_workout_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_training_session IS 'Completes active session and moves to workout_sets table (Migration 004 schema)';