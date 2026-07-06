-- Looper Database Setup
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  day_of_week VARCHAR NOT NULL,
  time VARCHAR NOT NULL,
  location VARCHAR NOT NULL,
  address TEXT,
  class_type VARCHAR NOT NULL,
  cost NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Weekly classes (for toggling which classes are active each week)
CREATE TABLE weekly_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(class_id, week_of)
);

-- Subscribers table
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  subscribed_at TIMESTAMP DEFAULT now(),
  UNIQUE(teacher_id, email)
);

-- Weekly updates (message from teacher for the week)
CREATE TABLE weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(teacher_id, week_of)
);

-- Create indexes for faster queries
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_weekly_classes_teacher_id ON weekly_classes(teacher_id);
CREATE INDEX idx_subscribers_teacher_id ON subscribers(teacher_id);
CREATE INDEX idx_weekly_updates_teacher_id ON weekly_updates(teacher_id);
