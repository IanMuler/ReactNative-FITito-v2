# FITito Backend API - Database Interactions Documentation

## Overview

The FITito backend API (`backend/src/exercises-simple.js`) is a comprehensive Express.js server that manages all database interactions for the fitness tracking application. The API handles 35+ endpoints organized into logical groups, each designed to interact with specific database tables while maintaining data integrity and performance.

## Architecture Summary

**Technology Stack:**
- **Framework**: Express.js with async/await patterns
- **Database**: PostgreSQL with connection pooling
- **ORM**: Raw SQL queries with prepared statements
- **Timezone**: Configured for Argentina (UTC-3)
- **Middleware**: CORS, JSON parsing, request logging

**Database Connection:**
```javascript
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fitito_dev',
  user: 'fitito_user',
  password: 'fitito_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  options: '--timezone=America/Argentina/Buenos_Aires'
});
```

**Key Design Patterns:**
- **Profile-based data isolation**: All operations require `profile_id`
- **Transaction management**: Complex operations use database transactions
- **JSONB configurations**: Flexible exercise and set configurations
- **Prepared statements**: Protection against SQL injection
- **Comprehensive logging**: Request/response tracking with emojis

---

## API Endpoints by Category

### 1. Health Check

#### `GET /health`
**Purpose**: Database connectivity verification

**Database Interaction:**
- **Table**: None (connectivity test)
- **Query**: `SELECT 1`
- **Pattern**: Simple connection test

**Response Format:**
```json
{
  "success": true,
  "message": "Server is healthy", 
  "timestamp": "2025-09-29T...",
  "database": "connected"
}
```

---

### 2. Exercise Management (5 endpoints)

#### `GET /api/v1/exercises`
**Purpose**: Retrieve all exercises in the system

**Database Interaction:**
- **Primary Table**: `exercises`
- **Query**: 
  ```sql
  SELECT id, name, image, created_at 
  FROM exercises 
  ORDER BY created_at DESC
  ```
- **Pattern**: Simple SELECT with ordering
- **Performance**: Uses `idx_exercises_name` index

**Response**: Array of exercise objects with metadata

---

#### `GET /api/v1/exercises/:id`
**Purpose**: Get single exercise by ID

**Database Interaction:**
- **Primary Table**: `exercises`
- **Query**: 
  ```sql
  SELECT id, name, image, created_at 
  FROM exercises 
  WHERE id = $1
  ```
- **Pattern**: Parameterized single-row lookup
- **Error Handling**: 404 if exercise not found

---

#### `POST /api/v1/exercises`
**Purpose**: Create new exercise

**Database Interaction:**
- **Primary Table**: `exercises`
- **Query**: 
  ```sql
  INSERT INTO exercises (name, image) 
  VALUES ($1, $2) 
  RETURNING id, name, image, created_at
  ```
- **Pattern**: INSERT with RETURNING clause
- **Validation**: Requires `name` and `image` fields
- **Response**: Created exercise with auto-generated ID

---

#### `PUT /api/v1/exercises/:id`
**Purpose**: Update existing exercise

**Database Interaction:**
- **Primary Table**: `exercises`
- **Query**: 
  ```sql
  UPDATE exercises 
  SET name = $1, image = $2 
  WHERE id = $3 
  RETURNING id, name, image, created_at
  ```
- **Pattern**: UPDATE with RETURNING
- **Error Handling**: 404 if exercise doesn't exist

---

#### `DELETE /api/v1/exercises/:id`
**Purpose**: Delete exercise

**Database Interaction:**
- **Primary Table**: `exercises`
- **Query**: 
  ```sql
  DELETE FROM exercises 
  WHERE id = $1 
  RETURNING id
  ```
- **Pattern**: DELETE with confirmation
- **Cascade Effect**: Automatically removes related records via FK constraints
- **Affected Tables**: `routine_day_configurations`, `training_day_exercises`, `training_session_exercises`, etc.

---

### 3. Training Days Management (5 endpoints)

#### `GET /api/v1/training-days`
**Purpose**: List all training days for a profile with exercise counts

**Database Interaction:**
- **Primary Tables**: `training_days`, `training_day_exercises`
- **Query**: 
  ```sql
  SELECT 
    td.id, td.name, td.description, td.is_active, 
    td.created_at, td.updated_at,
    COUNT(tde.id) as exercise_count
  FROM training_days td
  LEFT JOIN training_day_exercises tde ON td.id = tde.training_day_id
  WHERE td.profile_id = $1 AND td.is_active = true
  GROUP BY td.id, td.name, td.description, td.is_active, td.created_at, td.updated_at
  ORDER BY td.created_at DESC
  ```
- **Pattern**: LEFT JOIN with aggregation
- **Performance**: Uses multiple indexes for filtering and grouping

---

#### `GET /api/v1/training-days/:id`
**Purpose**: Get training day details with all exercises

**Database Interaction:**
- **Primary Tables**: `training_days`, `training_day_exercises`, `exercises`
- **Queries**: 
  1. Training day info:
     ```sql
     SELECT id, name, description, is_active, created_at, updated_at
     FROM training_days 
     WHERE id = $1 AND profile_id = $2
     ```
  2. Associated exercises:
     ```sql
     SELECT 
       tde.id, tde.training_day_id, tde.exercise_id, tde.order_index,
       tde.sets, tde.reps, tde.weight, tde.rest_seconds, tde.notes,
       e.name as exercise_name, e.image as exercise_image
     FROM training_day_exercises tde
     JOIN exercises e ON tde.exercise_id = e.id
     WHERE tde.training_day_id = $1
     ORDER BY tde.order_index ASC
     ```
- **Pattern**: Two-query approach with JOIN for exercise details

---

#### `POST /api/v1/training-days`
**Purpose**: Create training day with exercises

**Database Interaction:**
- **Primary Tables**: `training_days`, `training_day_exercises`
- **Transaction**: YES - Ensures atomicity
- **Queries**:
  1. Create training day:
     ```sql
     INSERT INTO training_days (profile_id, name, description, is_active)
     VALUES ($1, $2, $3, $4) 
     RETURNING id
     ```
  2. Add exercises (loop):
     ```sql
     INSERT INTO training_day_exercises 
     (training_day_id, exercise_id, order_index, sets, reps, weight, rest_seconds, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ```
- **Pattern**: Transaction with master-detail insertion
- **Rollback**: On any failure

---

#### `PUT /api/v1/training-days/:id`
**Purpose**: Update training day and its exercises

**Database Interaction:**
- **Primary Tables**: `training_days`, `training_day_exercises`
- **Transaction**: YES - Complex update operation
- **Queries**:
  1. Update training day:
     ```sql
     UPDATE training_days 
     SET name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND profile_id = $5
     ```
  2. Delete existing exercises:
     ```sql
     DELETE FROM training_day_exercises 
     WHERE training_day_id = $1
     ```
  3. Re-insert exercises (if provided)
- **Pattern**: Replace strategy (delete + insert)
- **Data Integrity**: Maintains referential integrity during updates

---

#### `DELETE /api/v1/training-days/:id`
**Purpose**: Soft delete training day

**Database Interaction:**
- **Primary Table**: `training_days`
- **Query**: 
  ```sql
  UPDATE training_days 
  SET is_active = false, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND profile_id = $2
  ```
- **Pattern**: Soft delete (preserves data)
- **Cascade**: Related exercises remain but become inaccessible

---

### 4. Routine Management (5 endpoints)

#### `GET /api/v1/routines`
**Purpose**: List all routines for a profile with exercise counts

**Database Interaction:**
- **Primary Tables**: `routines`, `routine_exercises`
- **Query**: 
  ```sql
  SELECT 
    r.id, r.name, r.description, r.color, r.duration_minutes,
    r.difficulty_level, r.is_active, r.is_favorite, r.tags, r.notes,
    r.created_at, r.updated_at,
    COUNT(re.id) as exercise_count
  FROM routines r
  LEFT JOIN routine_exercises re ON r.id = re.routine_id
  WHERE r.profile_id = $1 AND r.is_active = true
  GROUP BY r.id, r.name, r.description, r.color, r.duration_minutes, 
           r.difficulty_level, r.is_active, r.is_favorite, r.tags, r.notes, 
           r.created_at, r.updated_at
  ORDER BY r.is_favorite DESC, r.created_at DESC
  ```
- **Pattern**: LEFT JOIN with aggregation and favorite prioritization
- **Performance**: Uses GIN index on tags array

---

#### `GET /api/v1/routines/:id`
**Purpose**: Get routine details with all exercises

**Database Interaction:**
- **Primary Tables**: `routines`, `routine_exercises`, `exercises`
- **Queries**:
  1. Routine info:
     ```sql
     SELECT id, name, description, color, duration_minutes, difficulty_level, 
            is_active, is_favorite, tags, notes, created_at, updated_at
     FROM routines 
     WHERE id = $1 AND profile_id = $2
     ```
  2. Routine exercises:
     ```sql
     SELECT 
       re.id, re.routine_id, re.exercise_id, re.order_in_routine,
       re.sets, re.reps, re.weight, re.duration_seconds, re.rest_time_seconds,
       re.rpe, re.notes, re.is_superset, re.superset_group,
       re.created_at, re.updated_at,
       e.name as exercise_name, e.image as exercise_image
     FROM routine_exercises re
     JOIN exercises e ON re.exercise_id = e.id
     WHERE re.routine_id = $1
     ORDER BY re.order_in_routine ASC
     ```
- **Pattern**: Multi-query with detailed exercise information
- **Features**: Supports superset grouping and RPE tracking

---

#### `POST /api/v1/routines`
**Purpose**: Create routine with exercises

**Database Interaction:**
- **Primary Tables**: `routines`, `routine_exercises`
- **Transaction**: YES - Ensures data consistency
- **Queries**:
  1. Create routine:
     ```sql
     INSERT INTO routines (profile_id, name, description, color, duration_minutes, 
                          difficulty_level, is_favorite, tags, notes, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id
     ```
  2. Add exercises (loop):
     ```sql
     INSERT INTO routine_exercises 
     (routine_id, exercise_id, order_in_routine, sets, reps, weight, 
      duration_seconds, rest_time_seconds, rpe, notes, is_superset, superset_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ```
- **Features**: Full routine configuration with advanced parameters
- **Data Types**: Handles PostgreSQL arrays for tags

---

#### `PUT /api/v1/routines/:id`
**Purpose**: Update routine and exercises

**Database Interaction:**
- **Primary Tables**: `routines`, `routine_exercises`
- **Transaction**: YES - Complex update with replace strategy
- **Queries**:
  1. Update routine metadata
  2. Delete existing exercises
  3. Re-insert updated exercises
- **Pattern**: Complete replacement for exercises
- **Atomicity**: All changes committed together or rolled back

---

#### `DELETE /api/v1/routines/:id`
**Purpose**: Soft delete routine

**Database Interaction:**
- **Primary Table**: `routines`
- **Query**: 
  ```sql
  UPDATE routines 
  SET is_active = false, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND profile_id = $2
  ```
- **Pattern**: Soft delete preserving historical data
- **Cascade Effect**: Related routine_exercises remain but become inaccessible

---

### 5. Routine Week Schedule Management (6 endpoints)

#### `POST /api/v1/routine-weeks/initialize`
**Purpose**: Initialize weekly schedule for a profile

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Pattern**: Batch insertion for all 7 days
- **Special Logic**: Creates Spanish day names (Domingo, Lunes, etc.)
- **Default State**: All days start as non-rest days with empty configurations

---

#### `GET /api/v1/routine-weeks`
**Purpose**: Get weekly schedule for a profile

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Query**: 
  ```sql
  SELECT id, profile_id, day_of_week, day_name, is_rest_day, routine_id,
         completed_date, routine_name, training_day_id, exercises_config,
         created_at, updated_at
  FROM routine_weeks 
  WHERE profile_id = $1 
  ORDER BY day_of_week
  ```
- **Pattern**: Simple profile-based filtering with day ordering
- **JSONB**: Returns complex `exercises_config` as structured data

---

#### `PUT /api/v1/routine-weeks/:id`
**Purpose**: Update day configuration (routine assignment or rest day)

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Query Types**: 
  1. Assign routine:
     ```sql
     UPDATE routine_weeks 
     SET routine_id = $1, routine_name = $2, is_rest_day = false, 
         exercises_config = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND profile_id = $4
     ```
  2. Set as rest day:
     ```sql
     UPDATE routine_weeks 
     SET is_rest_day = true, routine_id = NULL, routine_name = NULL,
         exercises_config = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND profile_id = $4
     ```
- **Pattern**: Conditional update based on request type
- **Validation**: Enforces business rules (rest days can't have exercises)

---

#### `PUT /api/v1/routine-weeks/:id/complete`
**Purpose**: Mark a day as completed

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Query**: 
  ```sql
  UPDATE routine_weeks 
  SET completed_date = $1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $2 AND profile_id = $3
  ```
- **Pattern**: Simple completion tracking
- **Logging**: Comprehensive before/after state logging

---

#### `GET /api/v1/routine-weeks/:id/configuration`
**Purpose**: Get detailed exercise configuration for a day

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Query**: 
  ```sql
  SELECT exercises_config 
  FROM routine_weeks 
  WHERE id = $1 AND profile_id = $2
  ```
- **Pattern**: JSONB data retrieval
- **Response**: Structured exercise configuration array

---

#### `PUT /api/v1/routine-weeks/:id/configuration`
**Purpose**: Update exercise configuration for a day

**Database Interaction:**
- **Primary Table**: `routine_weeks`
- **Query**: 
  ```sql
  UPDATE routine_weeks 
  SET exercises_config = $1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $2 AND profile_id = $3
  ```
- **Pattern**: JSONB update with complex validation
- **Data Structure**: Supports detailed set configurations with RIR, RPE, drop sets, rest-pause

---

### 6. Workout History & Sessions (8 endpoints)

#### `GET /api/v1/workout-sessions`
**Purpose**: Get workout history with pagination and filtering

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`
- **Query**: 
  ```sql
  SELECT 
    ws.id, ws.profile_id, ws.routine_id, ws.name as routine_name,
    ws.started_at, ws.completed_at, ws.duration_minutes, ws.total_weight_lifted,
    ws.total_sets, ws.total_reps, ws.average_rpe, ws.notes, ws.is_completed,
    ws.workout_type, ws.location, ws.mood_before, ws.mood_after,
    ws.energy_before, ws.energy_after, ws.created_at, ws.updated_at,
    COUNT(DISTINCT wse.id)::INTEGER as exercises_count
  FROM workout_sessions ws
  LEFT JOIN workout_session_exercises wse ON ws.id = wse.workout_session_id
  WHERE ws.profile_id = $1
  AND ws.started_at >= CURRENT_DATE - INTERVAL '${days_back} days'
  GROUP BY ws.id
  ORDER BY ws.started_at DESC, ws.created_at DESC
  LIMIT $2
  ```
- **Features**: Date filtering, pagination, exercise counting
- **Performance**: Uses indexes on `profile_id` and `started_at`

---

#### `GET /api/v1/workout-sessions/by-date`
**Purpose**: Get specific workout session by date

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`
- **Pattern**: Date range query for full day
- **Query**: Complex date filtering with timezone handling
- **Special Logic**: 
  ```javascript
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  ```

---

#### `GET /api/v1/workout-history/:profileId/:date`
**Purpose**: Detailed workout history with exercises and sets

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`, `workout_session_sets`
- **Pattern**: Multi-query approach for complete workout data
- **Queries**:
  1. Get workout session
  2. Get exercises for session
  3. Get sets for each exercise
- **Data Assembly**: Complex nested object construction

---

#### `GET /api/v1/workout-sessions/:id`
**Purpose**: Get detailed workout session with exercises and sets

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`, `workout_session_sets`
- **Pattern**: Hierarchical data retrieval
- **Response Structure**: Session → Exercises → Sets hierarchy

---

#### `POST /api/v1/workout-sessions`
**Purpose**: Create new workout session

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`
- **Transaction**: YES - Ensures atomicity
- **Pattern**: Master-detail creation with exercise copying

---

#### `PUT /api/v1/workout-sessions/:id/complete`
**Purpose**: Complete workout session with statistics

**Database Interaction:**
- **Primary Table**: `workout_sessions`
- **Pattern**: Statistics calculation and update
- **Calculations**: Duration, total sets, reps, weight lifted

---

#### `DELETE /api/v1/workout-sessions/:id`
**Purpose**: Delete workout session

**Database Interaction:**
- **Primary Table**: `workout_sessions`
- **Pattern**: Hard delete with cascade
- **Cascade Effect**: Automatically removes exercises and sets

---

#### `DELETE /api/v1/workout-sessions/cleanup/:profileId`
**Purpose**: Cleanup incomplete sessions

**Database Interaction:**
- **Primary Table**: `workout_sessions`
- **Pattern**: Conditional deletion
- **Target**: Incomplete sessions older than certain threshold

---

### 7. Active Training Sessions (6 endpoints)

#### `GET /api/v1/training-sessions/active/:profileId`
**Purpose**: Get currently active training session

**Database Interaction:**
- **Primary Tables**: `training_sessions`, `training_session_exercises`, `training_session_progress`
- **Special Feature**: Uses database function `get_active_training_session($1)`
- **Query Pattern**: Function call + related data queries
- **Complex Assembly**: Session + exercises + progress data

---

#### `POST /api/v1/training-sessions`
**Purpose**: Start new training session

**Database Interaction:**
- **Primary Tables**: `training_sessions`, `training_session_exercises`
- **Transaction**: YES - Multi-table creation
- **Validation**: Prevents multiple active sessions
- **Pattern**: 
  1. Check for existing active session
  2. Create training session
  3. Copy exercises from routine configuration

---

#### `PUT /api/v1/training-sessions/:sessionId/progress`
**Purpose**: Update set progress during workout

**Database Interaction:**
- **Primary Table**: `training_session_progress`
- **Pattern**: UPSERT (Insert or Update)
- **Advanced Features**: Supports RIR, rest-pause details, drop sets, partials
- **JSONB Usage**: Complex set details stored as JSON

---

#### `POST /api/v1/training-sessions/:sessionId/complete`
**Purpose**: Complete training session and create workout history

**Database Interaction:**
- **Primary Tables**: `training_sessions`, `workout_sessions`, `workout_session_exercises`, `workout_session_sets`
- **Transaction**: YES - Complex multi-table operation
- **Pattern**: 
  1. Get training session data
  2. Create workout session
  3. Copy exercises to workout format
  4. Copy sets to workout format
  5. Update training session status

---

#### `DELETE /api/v1/training-sessions/:sessionId`
**Purpose**: Cancel active training session

**Database Interaction:**
- **Primary Table**: `training_sessions`
- **Pattern**: Status update (not delete)
- **Query**: 
  ```sql
  UPDATE training_sessions 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  ```

---

#### `GET /api/v1/training-sessions/:sessionId`
**Purpose**: Get training session details

**Database Interaction:**
- **Primary Tables**: `training_sessions`, `training_session_exercises`, `training_session_progress`
- **Pattern**: Multi-query data assembly
- **Response**: Complete session state for UI

---

### 8. Data Management & Cleanup (3 endpoints)

#### `DELETE /api/v1/clean-history/:date`
**Purpose**: Clean workout history before specific date

**Database Interaction:**
- **Primary Tables**: `workout_sessions`, `workout_session_exercises`, `workout_session_sets`
- **Pattern**: Cascading deletion by date
- **Safety**: Date validation and confirmation logging

---

#### `DELETE /api/v1/cleanup-workout-data` (duplicate endpoint)
**Purpose**: General workout data cleanup

**Database Interaction:**
- **Pattern**: Cleanup incomplete or orphaned data
- **Safety**: Comprehensive data integrity checks

---

## Advanced Database Patterns

### Transaction Management

The API uses database transactions for complex operations:

1. **Training Day Creation/Update**: Ensures exercises are added/updated atomically
2. **Routine Management**: Guarantees routine and exercises are consistent
3. **Session Completion**: Complex transformation from training to workout session
4. **Data Cleanup**: Ensures referential integrity during deletions

**Transaction Pattern:**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple operations...
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### JSONB Usage Patterns

The API extensively uses PostgreSQL's JSONB for flexible configurations:

1. **Exercise Configurations**: Complex set configurations with advanced parameters
2. **Progress Tracking**: Detailed set performance with technique modifiers
3. **Routine Settings**: Flexible metadata storage

**JSONB Structure Example:**
```json
{
  "exercises_config": [
    {
      "exercise_id": 21,
      "exercise_name": "Press mancuernas",
      "exercise_image": "file://...",
      "order_index": 0,
      "sets_config": [
        {
          "reps": "8",
          "weight": "5", 
          "rir": "5",
          "rp": [],
          "ds": [],
          "partials": null
        }
      ],
      "notes": ""
    }
  ]
}
```

### Complex Query Patterns

1. **Aggregation Queries**: Exercise counts, workout statistics
2. **Date-based Filtering**: Timezone-aware date operations
3. **Profile Isolation**: All queries filtered by profile_id
4. **Hierarchical Data**: Session → Exercises → Sets relationships

### Performance Considerations

1. **Indexing Strategy**: 
   - Profile-based indexes for data isolation
   - Date indexes for time-based queries
   - GIN indexes for JSONB and array operations

2. **Query Optimization**:
   - LEFT JOINs for optional relationships
   - Proper use of LIMIT for pagination
   - Efficient aggregation with GROUP BY

3. **Connection Management**:
   - Connection pooling for performance
   - Proper connection cleanup in transactions
   - Timeout configuration for reliability

### Error Handling Patterns

1. **Validation**: Input validation before database operations
2. **404 Handling**: Proper not-found responses for missing resources
3. **Transaction Rollback**: Automatic rollback on errors
4. **Detailed Logging**: Comprehensive error and success logging

The FITito backend API demonstrates sophisticated database interaction patterns while maintaining performance, data integrity, and user experience through careful design of SQL queries, transaction management, and error handling.