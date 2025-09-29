# FITito Database Documentation

## Overview

FITito is a comprehensive fitness tracking application built with a React Native frontend and Express.js backend, powered by a PostgreSQL database. The database is designed to support multiple user profiles per account, detailed exercise management, flexible routine configuration, and comprehensive workout tracking with advanced features like RIR (Reps in Reserve), RPE (Rate of Perceived Exertion), rest-pause sets, and drop sets.

## Database Architecture

The database follows a modular design with clear separation of concerns:

- **User Management**: Authentication and profile management
- **Exercise Library**: Centralized exercise definitions with images
- **Routine System**: Flexible workout routine creation and scheduling
- **Workout Execution**: Real-time workout session tracking
- **Progress Tracking**: Personal records and performance analytics

All tables include proper indexing, foreign key relationships, check constraints for data integrity, and audit trails with `created_at` and `updated_at` timestamps.

---

## Table Documentation

### 1. users

**Purpose**: Stores user authentication information and account-level settings.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique user identifier
- `email` (citext, UNIQUE): User email address with case-insensitive matching
- `password_hash` (varchar(255)): Bcrypt-hashed password
- `email_verified` (boolean): Email verification status
- `last_login_at` (timestamp): Last login timestamp
- `created_at` (timestamp): Account creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- Referenced by: `user_profiles.user_id`

**Key Features**:
- Email validation with regex constraint
- Case-insensitive email matching using `citext`
- Automatic `updated_at` trigger
- Proper indexing on email and creation date

**Real Data Examples**:

```sql
-- Example 1: Demo user account
id: 1
email: demo@fitito.com
password_hash: $2b$10$mXVaIAVq8LPqKpF1QYm0/.FO0C6FfHqMOPYvBbO8T7qE8bY0w6I0K
email_verified: true
last_login_at: null
created_at: 2025-09-22 00:10:08.263331
updated_at: 2025-09-22 00:10:08.263331
```

---

### 2. user_profiles

**Purpose**: Manages multiple user profiles per account, allowing users to track different personas or training goals (e.g., personal trainer managing multiple clients, family members sharing an account).

**Structure**:
- `id` (integer, PRIMARY KEY): Unique profile identifier
- `user_id` (integer, FOREIGN KEY): Reference to users table
- `profile_name` (varchar(50)): Unique profile name per user
- `display_name` (varchar(100)): Friendly display name
- `profile_type` (profile_type enum): Type of profile (personal, client, etc.)
- `is_active` (boolean): Currently active profile (only one per user)
- `avatar_url` (text): Profile picture URL
- `bio` (text): Profile description
- `date_of_birth` (date): Birth date for age calculations
- `weight_unit` (varchar(10)): Preferred weight unit (kg/lbs)
- `distance_unit` (varchar(10)): Preferred distance unit (km/miles)
- `settings` (jsonb): JSON settings object
- `created_at` (timestamp): Profile creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `users.id`
- Referenced by: Multiple tables (routines, training_sessions, etc.)

**Key Features**:
- One active profile per user constraint
- Profile name format validation (alphanumeric, underscore, dash)
- Flexible settings storage with JSONB
- Complete user preference management

**Real Data Examples**:

```sql
-- Example 1: Ian's profile (active)
id: 1
user_id: 1
profile_name: Ian
display_name: Ian Muler
profile_type: personal
is_active: true
avatar_url: null
bio: Focused on strength training and compound movements
date_of_birth: null
weight_unit: kg
distance_unit: km
settings: {"theme": "dark", "notifications": true, "autoStartTimer": false}
created_at: 2025-09-22 00:10:08.296771
updated_at: 2025-09-22 00:10:08.296771

-- Example 2: Melina's profile (inactive)
id: 2
user_id: 1
profile_name: Meli
display_name: Melina Rodriguez
profile_type: personal
is_active: false
avatar_url: null
bio: Love cardio and functional training
date_of_birth: null
weight_unit: kg
distance_unit: km
settings: {"theme": "light", "notifications": true, "autoStartTimer": true}
created_at: 2025-09-22 00:10:08.296771
updated_at: 2025-09-22 00:10:08.296771
```

---

### 3. exercises

**Purpose**: Centralized library of exercises with names and images. Serves as the master reference for all exercise-related functionality throughout the app.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique exercise identifier
- `name` (varchar(255)): Exercise name
- `image` (text): Exercise image file path or URL
- `created_at` (timestamp): Exercise creation timestamp

**Relationships**:
- Referenced by: Multiple exercise-related tables

**Key Features**:
- Centralized exercise management
- Image storage support (file paths or URLs)
- Indexed by name for fast searching
- Referenced by all exercise usage throughout the system

**Real Data Examples**:

```sql
-- Example 1: Lat pulldown exercise
id: 9
name: Jalón al pecho
image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/6f2c833c-0b67-42c8-9ca5-1b9a16e8e20d.png
created_at: 2025-09-28 21:14:23.898775

-- Example 2: Cable row exercise
id: 10
name: Remo en polea
image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/23650ea0-9cdc-4e30-9df9-f3c2e2c5a46c.png
created_at: 2025-09-28 21:14:47.41312
```

---

### 4. routines

**Purpose**: Defines workout routines with metadata like name, description, difficulty, and tags. These are reusable workout templates that can be assigned to specific days.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique routine identifier
- `profile_id` (integer, FOREIGN KEY): Owner profile
- `name` (varchar(255)): Routine name
- `description` (text): Routine description
- `color` (varchar(7)): Hex color code for UI
- `duration_minutes` (integer): Estimated duration
- `difficulty_level` (integer): Difficulty 1-5
- `is_active` (boolean): Active status
- `is_favorite` (boolean): Favorite status
- `tags` (text[]): Array of tags
- `notes` (text): Additional notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `user_profiles.id`
- Referenced by: `routine_exercises`, `routine_weeks`, `workout_sessions`

**Key Features**:
- Color-coded routine organization
- Difficulty scaling (1-5)
- Tag-based categorization with GIN index
- Full-text search on name

**Real Data Examples**:

```sql
-- Example 1: Upper body strength routine
id: 1
profile_id: 1
name: Upper Body Strength
description: Focus on chest, back, and shoulders with compound movements
color: #FF6B6B
duration_minutes: 75
difficulty_level: 4
is_active: true
is_favorite: true
tags: {strength,"upper body",compound}
notes: null
created_at: 2025-09-22 00:10:08.332743
updated_at: 2025-09-22 00:10:08.332743

-- Example 2: Leg day power routine
id: 2
profile_id: 1
name: Leg Day Power
description: Heavy compound leg movements for strength and size
color: #4ECDC4
duration_minutes: 90
difficulty_level: 5
is_active: true
is_favorite: false
tags: {strength,legs,power}
notes: null
created_at: 2025-09-22 00:10:08.332743
updated_at: 2025-09-22 00:10:08.332743
```

---

### 5. routine_weeks

**Purpose**: Maps routines to specific days of the week, creating a weekly schedule. Supports both routine assignments and custom exercise configurations per day.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique week day configuration identifier
- `profile_id` (integer, FOREIGN KEY): Owner profile
- `day_of_week` (integer): Day (0=Sunday, 6=Saturday)
- `day_name` (varchar(20)): Spanish day name
- `is_rest_day` (boolean): Rest day flag
- `routine_id` (integer, FOREIGN KEY): Assigned routine (nullable)
- `completed_date` (date): Last completion date
- `routine_name` (varchar(100)): Routine name cache
- `training_day_id` (integer, FOREIGN KEY): Alternative training day reference
- `exercises_config` (jsonb): Direct exercise configuration array
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `user_profiles.id`, `routines.id`, `training_days.id`
- Referenced by: `routine_day_configurations`, `training_sessions`

**Key Features**:
- Spanish day names for localization
- Flexible day configuration (routine or direct exercises)
- Rest day validation constraints
- Complex JSONB exercise configuration with GIN index

**Real Data Examples**:

```sql
-- Example 1: Monday with detailed exercise configuration (Melina's arm day)
id: 9
profile_id: 2
day_of_week: 1
day_name: Lunes
is_rest_day: false
routine_id: 5
completed_date: null
routine_name: Provisorio brazos
training_day_id: null
exercises_config: [
  {
    "notes": "",
    "exercise_id": 21,
    "order_index": 0,
    "sets_config": [
      {"ds": [], "rp": [], "rir": "5", "reps": "8", "weight": "5"},
      {"ds": [], "rp": [], "rir": "5", "reps": "8", "weight": "5"}
    ],
    "exercise_name": "Press mancuernas",
    "exercise_image": "file:///data/user/0/host.exp.exponent/cache/ImagePicker/e50e2507-60d4-4eef-b38b-93fddec3df7f.png"
  },
  {
    "notes": "",
    "exercise_id": 17,
    "order_index": 1,
    "sets_config": [
      {"ds": [], "rp": [], "rir": "5", "reps": "8", "weight": "5"},
      {"ds": [], "rp": [], "rir": "5", "reps": "8", "weight": "5"}
    ],
    "exercise_name": "Biceps mancuerna 1 y 1",
    "exercise_image": "file:///data/user/0/host.exp.exponent/cache/ImagePicker/193752d0-a65b-4dd1-83d7-2f83e7075d4d.png"
  }
]
created_at: 2025-09-24 22:52:28.536171
updated_at: 2025-09-29 11:49:47.686632

-- Example 2: Tuesday with empty configuration (Ian's profile)
id: 3
profile_id: 1
day_of_week: 2
day_name: Martes
is_rest_day: false
routine_id: null
completed_date: null
routine_name: null
training_day_id: null
exercises_config: []
created_at: 2025-09-24 22:52:28.536171
updated_at: 2025-09-24 22:52:28.536171
```

---

### 6. routine_day_configurations

**Purpose**: Stores individual exercise configurations for specific routine week days. This table provides detailed exercise setup including sets, reps, weights, and advanced training techniques.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique configuration identifier
- `routine_week_id` (integer, FOREIGN KEY): Reference to routine week day
- `training_day_id` (integer, FOREIGN KEY): Training day reference
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `exercise_name` (varchar(255)): Exercise name cache
- `exercise_image` (varchar(500)): Exercise image cache
- `order_index` (integer): Exercise order in the day
- `sets_config` (jsonb): Detailed sets configuration array
- `notes` (text): Exercise-specific notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `routine_weeks.id`, `training_days.id`, `exercises.id`

**Key Features**:
- Unique exercise order per day
- Complex JSONB sets configuration
- Exercise data caching for performance
- Comprehensive exercise ordering system

**Real Data Examples**:
Currently no data in this table as the system uses the `exercises_config` JSONB field in `routine_weeks` for direct configuration.

---

### 7. routine_exercises

**Purpose**: Links exercises to routines with specific parameters like sets, reps, weight, and rest periods. This is the traditional way to configure routine exercises (alternative to the JSONB approach).

**Structure**:
- `id` (integer, PRIMARY KEY): Unique routine exercise identifier
- `routine_id` (integer, FOREIGN KEY): Parent routine
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `order_in_routine` (integer): Exercise order
- `sets` (integer): Number of sets
- `reps` (integer): Target repetitions
- `weight` (numeric(6,2)): Target weight
- `duration_seconds` (integer): Duration for time-based exercises
- `rest_time_seconds` (integer): Rest time between sets
- `rpe` (integer): Target RPE (1-10)
- `notes` (text): Exercise notes
- `is_superset` (boolean): Superset flag
- `superset_group` (integer): Superset grouping
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `routines.id`
- Referenced by: `workout_sets.routine_exercise_id`

**Key Features**:
- Flexible exercise parameters (reps or duration)
- Superset support with grouping
- RPE (Rate of Perceived Exertion) integration
- Unique ordering per routine

**Real Data Examples**:

```sql
-- Example 1: Bench press in upper body routine
id: 1
routine_id: 1
exercise_id: 2
order_in_routine: 1
sets: 4
reps: 8
weight: 80.00
duration_seconds: null
rest_time_seconds: 180
rpe: null
notes: null
is_superset: false
superset_group: null
created_at: 2025-09-22 00:10:08.332743
updated_at: 2025-09-22 00:10:08.332743

-- Example 2: Overhead press in upper body routine
id: 2
routine_id: 1
exercise_id: 7
order_in_routine: 2
sets: 4
reps: 8
weight: 70.00
duration_seconds: null
rest_time_seconds: 180
rpe: null
notes: null
is_superset: false
superset_group: null
created_at: 2025-09-22 00:10:08.332743
updated_at: 2025-09-22 00:10:08.332743
```

---

### 8. training_days

**Purpose**: Custom training day templates that can be reused across different routine weeks. Provides a way to create named workout templates with descriptions.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique training day identifier
- `profile_id` (integer, FOREIGN KEY): Owner profile
- `name` (varchar(100)): Training day name
- `description` (text): Training day description
- `is_active` (boolean): Active status
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `user_profiles.id`
- Referenced by: `routine_day_configurations`, `routine_weeks`, `training_day_exercises`

**Key Features**:
- Unique name per profile constraint
- Multilingual name support (Spanish characters)
- Name format validation with regex
- Template reusability across routines

**Real Data Examples**:

```sql
-- Example 1: Updated chest and triceps training day (inactive)
id: 1
profile_id: 1
name: Pecho y Triceps Actualizado
description: Rutina actualizada
is_active: false
created_at: 2025-09-24 01:11:42.779073
updated_at: 2025-09-24 01:14:29.356303

-- Example 2: Test training day (inactive)
id: 56
profile_id: 1
name: Mmm
description: null
is_active: false
created_at: 2025-09-24 22:24:12.122452
updated_at: 2025-09-24 22:24:13.679384
```

---

### 9. training_day_exercises

**Purpose**: Links exercises to training day templates with specific parameters. This provides the exercise configuration for reusable training day templates.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique identifier
- `training_day_id` (integer, FOREIGN KEY): Parent training day
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `order_index` (integer): Exercise order
- `sets` (integer): Number of sets (default 3)
- `reps` (integer): Target repetitions (default 12)
- `weight` (numeric(5,2)): Target weight
- `rest_seconds` (integer): Rest time (default 60)
- `notes` (text): Exercise notes
- `created_at` (timestamp): Creation timestamp

**Relationships**:
- References: `training_days.id`, `exercises.id`

**Key Features**:
- Unique exercise per training day constraint
- Default values for common parameters
- Exercise ordering within training days
- Simple parameter management

**Real Data Examples**:

```sql
-- Example 1: Lateral raises in training day 74
id: 19
training_day_id: 74
exercise_id: 39
order_index: 0
sets: 3
reps: 12
weight: null
rest_seconds: 60
notes: null
created_at: 2025-09-28 23:27:41.767917

-- Example 2: Leg press in training day 77
id: 20
training_day_id: 77
exercise_id: 38
order_index: 0
sets: 3
reps: 12
weight: null
rest_seconds: 60
notes: null
created_at: 2025-09-28 23:31:00.244919
```

---

### 10. training_sessions

**Purpose**: Manages active workout sessions in real-time. Tracks the current state of an ongoing workout including which exercise the user is currently performing.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique session identifier
- `profile_id` (integer, FOREIGN KEY): Session owner
- `routine_week_id` (integer, FOREIGN KEY): Source routine week
- `routine_name` (varchar(255)): Routine name cache
- `day_of_week` (integer): Day number (1-7)
- `day_name` (varchar(20)): Spanish day name
- `status` (varchar(20)): Session status (active, paused, completed, cancelled)
- `current_exercise_index` (integer): Current exercise position
- `start_time` (timestamp): Session start time
- `last_activity` (timestamp): Last activity timestamp
- `notes` (text): Session notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `user_profiles.id`, `routine_weeks.id`
- Referenced by: `training_session_exercises`, `training_session_progress`

**Key Features**:
- Real-time session state management
- Exercise progression tracking
- Multiple status states for workflow
- Spanish day name support

**Real Data Examples**:

```sql
-- Example 1: Cancelled Sunday session (Melina's day)
id: 25
profile_id: 2
routine_week_id: 8
routine_name: Dia Meli
day_of_week: 7
day_name: Domingo
status: cancelled
current_exercise_index: 0
start_time: 2025-09-28 23:45:43.116815
last_activity: 2025-09-28 23:45:43.116815
notes: null
created_at: 2025-09-28 23:45:43.116815
updated_at: 2025-09-28 23:58:59.625045

-- Example 2: Cancelled Sunday session (Ian's legs and laterals)
id: 26
profile_id: 1
routine_week_id: 1
routine_name: Piernas y laterales A
day_of_week: 7
day_name: Domingo
status: cancelled
current_exercise_index: 0
start_time: 2025-09-28 23:45:51.994863
last_activity: 2025-09-28 23:45:51.994863
notes: null
created_at: 2025-09-28 23:45:51.994863
updated_at: 2025-09-28 23:58:59.625045
```

---

### 11. training_session_exercises

**Purpose**: Stores the exercises planned for a specific training session, copying exercise configuration from the routine for the session's duration.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique identifier
- `training_session_id` (integer, FOREIGN KEY): Parent session
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `exercise_name` (varchar(255)): Exercise name cache
- `exercise_image` (varchar(500)): Exercise image cache
- `order_in_session` (integer): Exercise order (1-based)
- `planned_sets` (jsonb): Planned sets configuration
- `performed_sets` (jsonb): Actually performed sets
- `is_completed` (boolean): Exercise completion status
- `notes` (text): Exercise notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `training_sessions.id`, `exercises.id`

**Key Features**:
- Planned vs performed set tracking
- Exercise data caching for session duration
- 1-based exercise ordering
- JSONB set configuration storage

**Real Data Examples**:

```sql
-- Example 1: Lateral raises exercise in session 25
id: 41
training_session_id: 25
exercise_id: 39
exercise_name: Laterales polea 1 mano
exercise_image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/69ed74e4-492a-41be-a4a1-551a65db11f8.jpeg
order_in_session: 1
planned_sets: [{"ds": [], "rp": [], "rir": "1", "reps": "1", "weight": "1"}]
performed_sets: []
is_completed: false
notes: null
created_at: 2025-09-28 23:45:43.116815
updated_at: 2025-09-28 23:45:43.116815

-- Example 2: Leg press exercise in session 25
id: 42
training_session_id: 25
exercise_id: 38
exercise_name: Prensa 45°
exercise_image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/75aa76db-0706-4b54-80be-d88ec331a2e7.png
order_in_session: 2
planned_sets: [{"ds": [], "rp": [], "rir": "1", "reps": "1", "weight": "1"}]
performed_sets: []
is_completed: false
notes: null
created_at: 2025-09-28 23:45:43.116815
updated_at: 2025-09-28 23:45:43.116815
```

---

### 12. training_session_progress

**Purpose**: Tracks set-by-set progress during active training sessions with support for advanced techniques like rest-pause, drop sets, and partials.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique progress identifier
- `training_session_id` (integer, FOREIGN KEY): Parent session
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `set_number` (integer): Set number
- `reps` (integer): Repetitions performed
- `weight` (numeric(6,2)): Weight used
- `rir` (integer): Reps in Reserve (0-10)
- `rest_pause_details` (jsonb): Rest-pause set details
- `drop_set_details` (jsonb): Drop set details
- `partials_details` (jsonb): Partial reps details
- `completed_at` (timestamp): Set completion time
- `is_completed` (boolean): Set completion status
- `notes` (text): Set notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `training_sessions.id`, `exercises.id`

**Key Features**:
- Unique set per session/exercise constraint
- Advanced training techniques support
- RIR (Reps in Reserve) tracking
- Flexible JSONB details storage

**Real Data Examples**:
Currently no data in this table.

---

### 13. workout_sessions

**Purpose**: Completed workout sessions with comprehensive statistics and metrics. This table stores the final results of completed workouts.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique session identifier
- `profile_id` (integer, FOREIGN KEY): Session owner
- `routine_id` (integer, FOREIGN KEY): Source routine
- `name` (varchar(255)): Session name
- `started_at` (timestamp): Start time
- `completed_at` (timestamp): Completion time
- `duration_minutes` (integer): Session duration
- `total_weight_lifted` (numeric(10,2)): Total weight volume
- `total_sets` (integer): Total sets performed
- `total_reps` (integer): Total repetitions
- `average_rpe` (numeric(3,1)): Average RPE (1-10)
- `notes` (text): Session notes
- `is_completed` (boolean): Completion status
- `workout_type` (varchar(50)): Workout type (default: strength)
- `location` (varchar(100)): Workout location
- `mood_before` (integer): Pre-workout mood (1-5)
- `mood_after` (integer): Post-workout mood (1-5)
- `energy_before` (integer): Pre-workout energy (1-5)
- `energy_after` (integer): Post-workout energy (1-5)
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `user_profiles.id`, `routines.id`
- Referenced by: `personal_records`, `workout_session_exercises`, `workout_sets`

**Key Features**:
- Comprehensive workout metrics
- Mood and energy tracking
- Completion validation constraints
- Multiple workout type support

**Real Data Examples**:

```sql
-- Example 1: Ian's Push day workout
id: 57
profile_id: 1
routine_id: null
name: Día de Ian - Push
started_at: 2025-09-28 20:30:34.813733
completed_at: 2025-09-28 20:32:22.982349
duration_minutes: 2
total_weight_lifted: null
total_sets: 0
total_reps: 0
average_rpe: null
notes: null
is_completed: true
workout_type: strength
location: null
mood_before: null
mood_after: null
energy_before: null
energy_after: null
created_at: 2025-09-28 20:32:22.982349
updated_at: 2025-09-28 20:32:22.982349

-- Example 2: Ian's Legs and laterals workout
id: 58
profile_id: 1
routine_id: null
name: Piernas y laterales A
started_at: 2025-09-29 00:38:48.113219
completed_at: 2025-09-29 00:39:30.147739
duration_minutes: 1
total_weight_lifted: null
total_sets: 0
total_reps: 0
average_rpe: null
notes: null
is_completed: true
workout_type: strength
location: null
mood_before: null
mood_after: null
energy_before: null
energy_after: null
created_at: 2025-09-29 00:39:30.147739
updated_at: 2025-09-29 00:39:30.147739
```

---

### 14. workout_session_exercises

**Purpose**: Links exercises to completed workout sessions, storing the exercises that were performed during a specific workout.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique identifier
- `workout_session_id` (integer, FOREIGN KEY): Parent session
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `exercise_name` (varchar(255)): Exercise name cache
- `exercise_image` (varchar(500)): Exercise image cache
- `order_in_session` (integer): Exercise order (1-based)
- `notes` (text): Exercise notes
- `is_completed` (boolean): Exercise completion status
- `created_at` (timestamp): Creation timestamp

**Relationships**:
- References: `workout_sessions.id`, `exercises.id`
- Referenced by: `workout_session_sets`

**Key Features**:
- Unique exercise order per session
- Exercise data caching
- 1-based ordering system
- Completion tracking per exercise

**Real Data Examples**:

```sql
-- Example 1: Leg press in workout session 58
id: 52
workout_session_id: 58
exercise_id: 38
exercise_name: Prensa 45°
exercise_image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/75aa76db-0706-4b54-80be-d88ec331a2e7.png
order_in_session: 1
notes: null
is_completed: false
created_at: 2025-09-29 00:39:30.147739

-- Example 2: Lateral raises in workout session 58
id: 53
workout_session_id: 58
exercise_id: 39
exercise_name: Laterales polea 1 mano
exercise_image: file:///data/user/0/host.exp.exponent/cache/ImagePicker/69ed74e4-492a-41be-a4a1-551a65db11f8.jpeg
order_in_session: 2
notes: null
is_completed: false
created_at: 2025-09-29 00:39:30.147739
```

---

### 15. workout_session_sets

**Purpose**: Individual sets performed during completed workout sessions with comprehensive tracking of reps, weight, RPE, RIR, and advanced techniques.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique set identifier
- `workout_session_exercise_id` (integer, FOREIGN KEY): Parent exercise
- `set_number` (integer): Set number (1-based)
- `reps` (integer): Repetitions performed
- `weight` (numeric(6,2)): Weight used
- `duration_seconds` (integer): Duration for time-based sets
- `rir` (integer): Reps in Reserve (0-10)
- `rpe` (integer): Rate of Perceived Exertion (1-10)
- `rest_seconds` (integer): Rest time taken
- `is_completed` (boolean): Set completion status
- `is_warmup` (boolean): Warmup set flag
- `notes` (text): Set notes
- `rest_pause_reps` (integer[]): Rest-pause repetitions array
- `drop_set_weights` (numeric(6,2)[]): Drop set weights array
- `partial_reps` (integer): Number of partial reps
- `created_at` (timestamp): Creation timestamp

**Relationships**:
- References: `workout_session_exercises.id`

**Key Features**:
- Unique set per exercise constraint
- Advanced technique tracking (rest-pause, drop sets, partials)
- Flexible reps or duration requirement
- Comprehensive performance metrics

**Real Data Examples**:

```sql
-- Example 1: Set 1 for exercise 56
id: 3
workout_session_exercise_id: 56
set_number: 1
reps: 2
weight: 2.00
duration_seconds: null
rir: 1
rpe: null
rest_seconds: null
is_completed: true
is_warmup: false
notes: null
rest_pause_reps: null
drop_set_weights: null
partial_reps: null
created_at: 2025-09-29 00:39:30.147739

-- Example 2: Set 1 for exercise 58
id: 4
workout_session_exercise_id: 58
set_number: 1
reps: 4
weight: 4.00
duration_seconds: null
rir: 4
rpe: null
rest_seconds: null
is_completed: true
is_warmup: false
notes: null
rest_pause_reps: null
drop_set_weights: null
partial_reps: null
created_at: 2025-09-29 00:57:42.688025
```

---

### 16. workout_sets

**Purpose**: Legacy/alternative set tracking table with additional advanced technique support including detailed JSONB storage for complex training methods.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique set identifier
- `session_id` (integer, FOREIGN KEY): Parent session
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `routine_exercise_id` (integer, FOREIGN KEY): Source routine exercise
- `set_number` (integer): Set number (1-based)
- `reps` (integer): Repetitions performed
- `weight` (numeric(6,2)): Weight used
- `duration_seconds` (integer): Duration for time-based exercises
- `distance_meters` (numeric(8,2)): Distance for cardio exercises
- `rpe` (integer): Rate of Perceived Exertion (1-10)
- `rest_time_seconds` (integer): Rest time taken
- `notes` (text): Set notes
- `is_warmup` (boolean): Warmup set flag
- `is_completed` (boolean): Set completion status
- `completed_at` (timestamp): Completion timestamp
- `rir` (integer): Reps in Reserve (0-10)
- `rest_pause_sets` (jsonb): Rest-pause details
- `drop_sets` (jsonb): Drop set details
- `partials` (jsonb): Partial reps details
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Relationships**:
- References: `workout_sessions.id`, `routine_exercises.id`

**Key Features**:
- Distance tracking for cardio
- JSONB storage for complex techniques
- Flexible exercise type support
- Comprehensive performance tracking

**Real Data Examples**:
Currently no data in this table.

---

### 17. personal_records

**Purpose**: Tracks personal bests and records for each exercise per profile, supporting multiple record types like 1RM, volume, reps, time, and distance.

**Structure**:
- `id` (integer, PRIMARY KEY): Unique record identifier
- `profile_id` (integer, FOREIGN KEY): Record owner
- `exercise_id` (integer, FOREIGN KEY): Exercise reference
- `record_type` (varchar(20)): Type of record (1rm, volume, reps, time, distance)
- `value` (numeric(10,2)): Record value
- `unit` (varchar(10)): Unit of measurement
- `reps` (integer): Repetitions for the record
- `achieved_at` (timestamp): When record was achieved
- `session_id` (integer, FOREIGN KEY): Session where record was set
- `notes` (text): Record notes
- `is_estimated` (boolean): Whether record is estimated
- `created_at` (timestamp): Creation timestamp

**Relationships**:
- References: `user_profiles.id`, `workout_sessions.id`

**Key Features**:
- Unique record per profile/exercise/type
- Multiple record type support
- Session tracking for record verification
- Estimated vs actual record distinction

**Real Data Examples**:
Currently no data in this table.

---

### 18. routine_day_configurations_backup

**Purpose**: Backup table storing historical routine day configurations, likely created during system migration or data preservation.

**Structure**:
- `id` (integer): Configuration identifier
- `routine_week_id` (integer): Parent routine week
- `training_day_id` (integer): Training day reference
- `exercise_id` (integer): Exercise reference
- `exercise_name` (varchar(255)): Exercise name
- `exercise_image` (varchar(500)): Exercise image
- `order_index` (integer): Exercise order
- `sets_config` (jsonb): Sets configuration
- `notes` (text): Configuration notes
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Update timestamp

**Key Features**:
- Historical data preservation
- Same structure as main configuration table
- No constraints or foreign keys

**Real Data Examples**:

```sql
-- Example 1: Push-up configuration backup
id: 9
routine_week_id: 4
training_day_id: 57
exercise_id: 1
exercise_name: Push-up
exercise_image: https://example.com/pushups.jpg
order_index: 0
sets_config: [
  {"ds": [], "rp": [], "rir": "", "reps": "12", "weight": "", "partials": null},
  {"ds": [], "rp": [], "rir": "", "reps": "12", "weight": "", "partials": null},
  {"ds": [], "rp": [], "rir": "", "reps": "12", "weight": "", "partials": null}
]
notes: null
created_at: 2025-09-27 00:00:07.318996
updated_at: 2025-09-27 00:00:07.318996

-- Example 2: Updated push-up configuration backup
id: 30
routine_week_id: 5
training_day_id: 57
exercise_id: 1
exercise_name: Push-up
exercise_image: https://example.com/pushups.jpg
order_index: 0
sets_config: [
  {"ds": [], "rp": [], "rir": "1", "reps": "12", "weight": "1"},
  {"ds": [], "rp": [], "rir": "1", "reps": "12", "weight": "1"},
  {"ds": [], "rp": [], "rir": "1", "reps": "12", "weight": "1"}
]
notes: null
created_at: 2025-09-28 00:44:33.63439
updated_at: 2025-09-28 00:44:33.63439
```

---

## Database Relationships Summary

### Primary Data Flow:
1. **User Management**: `users` → `user_profiles`
2. **Exercise Library**: `exercises` (central reference)
3. **Routine Planning**: `user_profiles` → `routines` → `routine_exercises`
4. **Schedule Management**: `user_profiles` → `routine_weeks` (with JSONB config)
5. **Workout Execution**: `routine_weeks` → `training_sessions` → `training_session_exercises`
6. **Workout Completion**: `training_sessions` → `workout_sessions` → `workout_session_exercises` → `workout_session_sets`
7. **Progress Tracking**: `workout_sessions` → `personal_records`

### Key Design Patterns:
- **Denormalization**: Exercise names and images cached in session tables for performance
- **JSONB Configuration**: Complex set configurations stored as JSON for flexibility
- **Multi-Profile Support**: Single user account with multiple training profiles
- **Audit Trails**: Comprehensive timestamps with automatic update triggers
- **Spanish Localization**: Day names in Spanish for local market
- **Advanced Training**: Support for RIR, RPE, rest-pause, drop sets, and partials
- **Data Integrity**: Extensive check constraints and foreign key relationships

The database is designed to support a comprehensive fitness tracking application with advanced features for serious athletes while maintaining flexibility for casual users.