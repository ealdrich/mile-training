-- Mile Training App Database Schema
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workout Library table (stores the predefined workouts)
CREATE TABLE workout_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    description TEXT NOT NULL,
    rx TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('primary', 'secondary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Schedules table
CREATE TABLE training_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    training_start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Weeks table (12 weeks per schedule)
CREATE TABLE schedule_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES training_schedules(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
    mileage_goal DECIMAL(4,1),
    actual_mileage DECIMAL(4,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, week_number)
);

-- Schedule Workouts table (workouts assigned to specific weeks)
CREATE TABLE schedule_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES schedule_weeks(id) ON DELETE CASCADE,
    workout_id TEXT REFERENCES workout_library(id),
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    completed_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout History table (actual workout performances)
CREATE TABLE workout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id TEXT REFERENCES workout_library(id),
    date DATE NOT NULL,
    actual_times TEXT[], -- Array of time strings
    target_times TEXT[], -- Array of target time strings
    notes TEXT,
    weather TEXT,
    location TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined workouts from your app
INSERT INTO workout_library (id, name, nickname, description, rx, category) VALUES
-- Primary/Core Workouts
('p1', '400-1000-400 Pyramid', 'The Pyramid 1000', '2x 400m, 3x 1000m, 2x 400m', '400s @68-70s, 1000s @72-76s, 400s @68-70s w/ 400m recoveries', 'primary'),
('p2', '200-400-600-400-200 Pyramid Sets', 'The Pyramid 600', '2 x (200-400-600-400-200)', '200s @31-33s, 400s @68s, 600s @70-72s w/ 200m recoveries', 'primary'),
('p3', '400m Alternating Recovery', 'The 400 Alternator', '8-10 x 400m with alternating recovery', 'Odds @68s w/ 100m recoveries, Evens @70s w/ 400m recoveries', 'primary'),
('p4', '800-400-200-400-800 Sandwich', 'The V', '2x800 @72, 1x400 @68, 1x200 @32, 1x400 @68, 2x800 @72', '800s @72s, 400s @68s, 200s @32s w/ 400m recoveries after 800s & 400s and 200m recoveries after 200s', 'primary'),
('p5', '600-200 Couplets', 'Dan''s Couplets', '5 x (600-200)', '600s @70-72s, 200s @30-32s w/ 200m rec between, 400m rec between sets', 'primary'),
('p6', '400-200-800-200-400', 'The W', '2x400, 2x200, 2x800, 2x200, 2x400', '400s @66-68s, 200s @31-32s, 800s @72-75s w/ 200m rec (400m after 800s)', 'primary'),
('p7', '600-400-200-100 Descending Ladder', 'The Descender', '3x (600-400-200-100)', '600s @78s, 400s @76s, 200s @33s, 100s @16s w/ 200/400/300/400m recoveries', 'primary'),
('p8', '400 @ Goal', 'Goal Pace Special', '6x 400m @goal pace', '400s @64-67s (goal race pace) w/ 400m recoveries', 'primary'),
('p9', '1000 @ Goal', '1000 Hot', '4x200, 1x1000, 4x150 one step', '200s @32s w/ 200m rec, 1000 @68s w/ 400m rec, 150s one step w/ 250m rec', 'primary'),

-- Secondary/Speed Workouts
('s1', '200m Repeats', 'My Little Delights', '6-8 x 200m', '@28-32s w/ 600m recoveries - best possible average', 'secondary'),
('s2', '100m Strides', 'Hunger Builder', '8 x 100m', '@12-14s w/ 300m recoveries - relaxed speed', 'secondary'),
('s3', '300-200-100 Descending Triplets', 'The Triplets', '3 x (300-200-100)', '300s @48-50s, 200s @30-33s, 100s @13-15s w/ 500/600/700m recoveries', 'secondary'),
('s4', '150m One Step', 'One Steps', '4-6 x 150m one step', 'Relaxed acceleration to near-max w/ 250m recoveries', 'secondary'),
('s5', '400m Time Trial', 'The 400 TT', '4 x 400m @best average', '@59-62s w/ 1200m recoveries - race simulation', 'secondary'),
('s6', '250m Repeats', 'The 250s', '6 x 250m', 'Fast effort w/ 650m recoveries', 'secondary'),
('s7', '200-400-200 Sandwich', '400 All Out', '4x200, 1x400, 4x200', '200s @ 31-32s, 400 @ 58-60s w/ 200m recoveries after 200s and 600-800m recovery after the 400', 'secondary'),
('s8', '300m Repeats', 'The 300s', '6 x 300m', '@best possible average w/ 500m recoveries', 'secondary');

-- Create indexes for better performance
CREATE INDEX idx_schedule_weeks_schedule_id ON schedule_weeks(schedule_id);
CREATE INDEX idx_schedule_workouts_week_id ON schedule_workouts(week_id);
CREATE INDEX idx_workout_history_workout_id ON workout_history(workout_id);
CREATE INDEX idx_workout_history_date ON workout_history(date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_training_schedules_updated_at BEFORE UPDATE ON training_schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_schedule_weeks_updated_at BEFORE UPDATE ON schedule_weeks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_schedule_workouts_updated_at BEFORE UPDATE ON schedule_workouts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workout_history_updated_at BEFORE UPDATE ON workout_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workout_library_updated_at BEFORE UPDATE ON workout_library FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Workout Versions table (for versioning workout edits)
CREATE TABLE workout_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id TEXT REFERENCES workout_library(id),
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    description TEXT NOT NULL,
    rx TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('primary', 'secondary')),
    edited_by TEXT, -- Could reference a users table in future
    edit_reason TEXT, -- Optional reason for the edit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workout_id, version_number)
);

-- Create indexes for workout versions
CREATE INDEX idx_workout_versions_workout_id ON workout_versions(workout_id);
CREATE INDEX idx_workout_versions_created_at ON workout_versions(created_at DESC);

-- Add version tracking to workout_library
ALTER TABLE workout_library ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE workout_library ADD COLUMN is_custom BOOLEAN DEFAULT FALSE;

-- Add user ownership to relevant tables
ALTER TABLE training_schedules ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE workout_history ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE workout_library ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Enable Row Level Security (RLS)
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_library ENABLE ROW LEVEL SECURITY;

-- Create policies for training schedules (users can only see their own)
CREATE POLICY "Users can view their own training schedules" ON training_schedules
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training schedules" ON training_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training schedules" ON training_schedules
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own training schedules" ON training_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for schedule weeks (inherit from parent schedule)
CREATE POLICY "Users can view their schedule weeks" ON schedule_weeks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND training_schedules.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their schedule weeks" ON schedule_weeks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND training_schedules.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their schedule weeks" ON schedule_weeks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND training_schedules.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their schedule weeks" ON schedule_weeks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND training_schedules.user_id = auth.uid()
        )
    );

-- Create policies for schedule workouts (inherit from parent schedule)
CREATE POLICY "Users can view their schedule workouts" ON schedule_workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND ts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their schedule workouts" ON schedule_workouts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND ts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their schedule workouts" ON schedule_workouts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND ts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their schedule workouts" ON schedule_workouts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND ts.user_id = auth.uid()
        )
    );

-- Create policies for workout history (users can only see their own)
CREATE POLICY "Users can view their own workout history" ON workout_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workout history" ON workout_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout history" ON workout_history
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout history" ON workout_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for workout library (shared but with ownership tracking)
-- Everyone can view all workouts (shared library)
CREATE POLICY "All users can view workout library" ON workout_library
    FOR SELECT USING (true);
-- Users can only insert workouts as themselves
CREATE POLICY "Users can insert workouts" ON workout_library
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
-- Users can only update their own custom workouts
CREATE POLICY "Users can update their own workouts" ON workout_library
    FOR UPDATE USING (auth.uid() = created_by AND is_custom = true);
-- Users can only delete their own custom workouts
CREATE POLICY "Users can delete their own workouts" ON workout_library
    FOR DELETE USING (auth.uid() = created_by AND is_custom = true);

-- Create policies for workout versions (inherit from parent workout)
CREATE POLICY "All users can view workout versions" ON workout_versions
    FOR SELECT USING (true);
CREATE POLICY "Users can insert workout versions" ON workout_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_library
            WHERE workout_library.id = workout_versions.workout_id
            AND (workout_library.created_by = auth.uid() OR workout_library.created_by IS NULL)
        )
    );

-- Schedule Sharing System
-- Table to track which schedules are shared with which users
CREATE TABLE schedule_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES training_schedules(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, shared_with_user_id)
);

-- Create indexes for schedule sharing
CREATE INDEX idx_schedule_shares_schedule_id ON schedule_shares(schedule_id);
CREATE INDEX idx_schedule_shares_shared_with ON schedule_shares(shared_with_user_id);

-- Enable RLS for schedule shares
ALTER TABLE schedule_shares ENABLE ROW LEVEL SECURITY;

-- Policies for schedule shares
CREATE POLICY "Users can view shares they created or received" ON schedule_shares
    FOR SELECT USING (
        auth.uid() = shared_by_user_id OR
        auth.uid() = shared_with_user_id
    );

CREATE POLICY "Users can create shares for their own schedules" ON schedule_shares
    FOR INSERT WITH CHECK (
        auth.uid() = shared_by_user_id AND
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_shares.schedule_id
            AND training_schedules.user_id = auth.uid()
        )
    );

CREATE POLICY "Schedule owners can delete shares" ON schedule_shares
    FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Update training schedules policies to include shared access
DROP POLICY "Users can view their own training schedules" ON training_schedules;
CREATE POLICY "Users can view their own or shared training schedules" ON training_schedules
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM schedule_shares
            WHERE schedule_shares.schedule_id = training_schedules.id
            AND schedule_shares.shared_with_user_id = auth.uid()
        )
    );

-- Update other policies to allow shared access with edit permission
DROP POLICY "Users can update their own training schedules" ON training_schedules;
CREATE POLICY "Users can update their own or editable shared training schedules" ON training_schedules
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM schedule_shares
            WHERE schedule_shares.schedule_id = training_schedules.id
            AND schedule_shares.shared_with_user_id = auth.uid()
            AND schedule_shares.permission_level = 'edit'
        )
    );

-- Update schedule weeks policies for shared access
DROP POLICY "Users can view their schedule weeks" ON schedule_weeks;
CREATE POLICY "Users can view their own or shared schedule weeks" ON schedule_weeks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND (
                training_schedules.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = training_schedules.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY "Users can update their schedule weeks" ON schedule_weeks;
CREATE POLICY "Users can update their own or editable shared schedule weeks" ON schedule_weeks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND (
                training_schedules.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = training_schedules.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

DROP POLICY "Users can insert their schedule weeks" ON schedule_weeks;
CREATE POLICY "Users can insert weeks for their own or editable shared schedules" ON schedule_weeks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND (
                training_schedules.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = training_schedules.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

DROP POLICY "Users can delete their schedule weeks" ON schedule_weeks;
CREATE POLICY "Users can delete weeks from their own or editable shared schedules" ON schedule_weeks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM training_schedules
            WHERE training_schedules.id = schedule_weeks.schedule_id
            AND (
                training_schedules.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = training_schedules.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

-- Update schedule workouts policies similarly
DROP POLICY "Users can view their schedule workouts" ON schedule_workouts;
CREATE POLICY "Users can view their own or shared schedule workouts" ON schedule_workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND (
                ts.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = ts.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY "Users can update their schedule workouts" ON schedule_workouts;
CREATE POLICY "Users can update their own or editable shared schedule workouts" ON schedule_workouts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND (
                ts.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = ts.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

DROP POLICY "Users can insert their schedule workouts" ON schedule_workouts;
CREATE POLICY "Users can insert workouts for their own or editable shared schedules" ON schedule_workouts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND (
                ts.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = ts.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

DROP POLICY "Users can delete their schedule workouts" ON schedule_workouts;
CREATE POLICY "Users can delete workouts from their own or editable shared schedules" ON schedule_workouts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM schedule_weeks sw
            JOIN training_schedules ts ON sw.schedule_id = ts.id
            WHERE sw.id = schedule_workouts.week_id
            AND (
                ts.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM schedule_shares
                    WHERE schedule_shares.schedule_id = ts.id
                    AND schedule_shares.shared_with_user_id = auth.uid()
                    AND schedule_shares.permission_level = 'edit'
                )
            )
        )
    );

-- Function to get user by email (for sharing)
CREATE OR REPLACE FUNCTION get_user_by_email(email_address TEXT)
RETURNS TABLE(id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  WHERE au.email = email_address
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;