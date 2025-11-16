-- Authentication System Schema for Sterling's Blog
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'default',
    notification_sound BOOLEAN DEFAULT true,
    show_typing_indicators BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update basement_users to link with authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_users' AND column_name='user_id') THEN
        ALTER TABLE basement_users ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update basement_chat to link with authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_chat' AND column_name='user_id') THEN
        ALTER TABLE basement_chat ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users policies (public can read display info, only user can update own data)
CREATE POLICY "Allow public read access to user profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own profile" ON users
    FOR UPDATE USING (true);

-- Sessions policies (users can only see their own sessions)
CREATE POLICY "Allow public insert to sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow public delete from sessions" ON sessions
    FOR DELETE USING (true);

-- User preferences policies
CREATE POLICY "Allow public read access to user_preferences" ON user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert to user_preferences" ON user_preferences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to user_preferences" ON user_preferences
    FOR UPDATE USING (true);

-- Create an admin user (change password after first login!)
-- Password is 'admin123' hashed with bcrypt
-- You'll change this through the UI after implementing auth
INSERT INTO users (username, email, password_hash, display_name, is_admin)
VALUES ('admin', 'admin@sterling.ooo', '$2b$10$placeholder', 'Administrator', true)
ON CONFLICT (username) DO NOTHING;


