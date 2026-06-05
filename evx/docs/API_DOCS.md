# EVX API Documentation

## Services

### `src/services/supabase.ts`

#### `authService`
| Method | Description |
|---|---|
| `signUp(email, password, fullName)` | Register new user |
| `signIn(email, password)` | Authenticate user |
| `signOut()` | End session |
| `resetPassword(email)` | Send reset email |
| `getSession()` | Get current session |
| `getUser()` | Get authenticated user |

#### `healthProfileService`
| Method | Description |
|---|---|
| `get(userId)` | Get user's health profile |
| `upsert(profile)` | Create or update health profile |

#### `workoutService`
| Method | Description |
|---|---|
| `list(userId)` | Get all workouts |
| `create(workout)` | Save a workout |
| `update(id, updates)` | Update a workout |
| `markCompleted(id)` | Mark as done |

#### `nutritionService`
| Method | Description |
|---|---|
| `list(userId)` | Get all meal plans |
| `getByDate(userId, date)` | Get plan for specific date |
| `create(plan)` | Save a meal plan |

#### `labService`
| Method | Description |
|---|---|
| `list(userId)` | Get all lab reports |
| `create(report)` | Save lab report record |
| `updateStatus(id, status)` | Update processing status |
| `uploadFile(userId, blob, name)` | Upload to Supabase Storage |
| `getAnalysis(reportId)` | Get AI analysis for report |
| `saveAnalysis(analysis)` | Save AI analysis |

#### `dailyPlanService`
| Method | Description |
|---|---|
| `getByDate(userId, date)` | Get plan for specific date |
| `create(plan)` | Save a daily plan |
| `list(userId, limit)` | Get recent plans |

#### `progressService`
| Method | Description |
|---|---|
| `list(userId, days)` | Get logs for last N days |
| `upsert(log)` | Create or update today's log |
| `getLatest(userId)` | Get most recent log |

### `src/services/ai.ts`

| Function | Description |
|---|---|
| `generateWorkout(profile)` | AI workout generation |
| `generateMealPlan(profile)` | AI meal plan generation |
| `analyzeLabReport(profile, text)` | AI lab analysis |
| `generateDailyPlan(profile, date)` | AI daily plan generation |

All AI functions return strongly-typed Partial<T> objects matching the database schema.

## Database Tables

| Table | Primary Key | RLS | Unique Constraint |
|---|---|---|---|
| users | id (UUID) | ✓ | - |
| health_profiles | id (UUID) | ✓ | user_id |
| goals | id (UUID) | ✓ | - |
| workouts | id (UUID) | ✓ | - |
| meal_plans | id (UUID) | ✓ | (user_id, date) |
| lab_reports | id (UUID) | ✓ | - |
| lab_analysis | id (UUID) | ✓ | lab_report_id |
| daily_plans | id (UUID) | ✓ | (user_id, date) |
| progress_logs | id (UUID) | ✓ | (user_id, date) |
