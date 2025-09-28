-- Migration 011: Fix complete_training_session function to match existing workout_sessions schema

-- Drop the existing function
DROP FUNCTION IF EXISTS complete_training_session(INTEGER);

-- Recreate with correct column mapping
CREATE OR REPLACE FUNCTION complete_training_session(session_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    training_session_record RECORD;
    new_workout_session_id INTEGER;
    exercise_record RECORD;
    new_exercise_id INTEGER;
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
    
    -- Create workout session with correct column names
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
    
    -- Copy exercises to workout session
    FOR exercise_record IN 
        SELECT * FROM training_session_exercises 
        WHERE training_session_id = session_id 
        ORDER BY order_in_session
    LOOP
        INSERT INTO workout_session_exercises (
            workout_session_id,
            exercise_id,
            exercise_name,
            exercise_image,
            order_in_session,
            is_completed
        ) VALUES (
            new_workout_session_id,
            exercise_record.exercise_id,
            exercise_record.exercise_name,
            exercise_record.exercise_image,
            exercise_record.order_in_session,
            exercise_record.is_completed
        ) RETURNING id INTO new_exercise_id;
        
        -- Copy sets from progress to workout sets
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
            INSERT INTO workout_session_sets (
                workout_session_exercise_id,
                set_number,
                reps,
                weight,
                rir,
                rest_pause_reps,
                drop_set_weights,
                partial_reps,
                is_completed,
                notes
            ) VALUES (
                new_exercise_id,
                progress_record.set_number,
                progress_record.reps,
                progress_record.weight,
                progress_record.rir,
                -- Convert JSONB to arrays for existing schema
                CASE 
                    WHEN progress_record.rest_pause_details IS NOT NULL 
                    THEN ARRAY(SELECT (value::text)::INTEGER FROM jsonb_array_elements(progress_record.rest_pause_details) as value)
                    ELSE NULL 
                END,
                CASE 
                    WHEN progress_record.drop_set_details IS NOT NULL 
                    THEN ARRAY(SELECT (value->>'peso')::DECIMAL(6,2) FROM jsonb_array_elements(progress_record.drop_set_details) as value)
                    ELSE NULL 
                END,
                CASE 
                    WHEN progress_record.partials_details IS NOT NULL 
                    THEN (progress_record.partials_details->>'reps')::INTEGER
                    ELSE NULL 
                END,
                TRUE,
                progress_record.notes
            );
        END LOOP;
    END LOOP;
    
    -- Mark training session as completed
    UPDATE training_sessions 
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = session_id;
    
    RETURN new_workout_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_training_session IS 'Completes active session and moves to workout_sessions history (fixed column mapping)';