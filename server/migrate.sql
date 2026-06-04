-- Migration: add users table and wire up user ownership
-- Run once against training_app: psql -U eric -d training_app -f migrate.sql

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user ownership columns (nullable so existing data is preserved)
ALTER TABLE training_schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE workout_history    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE workout_library    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Schedule sharing table
CREATE TABLE IF NOT EXISTS schedule_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES training_schedules(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_shares_schedule_id ON schedule_shares(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_shares_shared_with ON schedule_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_training_schedules_user_id ON training_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON workout_history(user_id);

-- NOTE: There is 1 existing training schedule with no user_id.
-- After you create your account, run this to claim it:
--   UPDATE training_schedules SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- Find your UUID after signup: SELECT id FROM users WHERE email = 'your@email.com';
