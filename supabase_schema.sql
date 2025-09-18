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