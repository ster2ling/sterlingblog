-- Supabase Database Schema for Sterling's Blog
-- Run these SQL commands in your Supabase SQL editor

-- Site Stats Table (single row for global stats)
CREATE TABLE site_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    visitor_count INTEGER DEFAULT 0,
    first_visit BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    last_updated BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggestions Table
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Anonymous',
    suggestion TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dev Log Posts Table
CREATE TABLE dev_log_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Settings Table (for mood, home thread, etc.)
CREATE TABLE admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mood_description TEXT DEFAULT 'i want to see my girlfriend',
    home_thread TEXT DEFAULT '',
    image_path TEXT DEFAULT 'images/avatar.JPG',
    image_alt TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts Table
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Anonymous',
    timestamp TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_log_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to site_stats" ON site_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to suggestions" ON suggestions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dev_log_posts" ON dev_log_posts
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to admin_settings" ON admin_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to forum_posts" ON forum_posts
    FOR SELECT USING (true);

-- Create policies for public insert/update access
CREATE POLICY "Allow public insert to suggestions" ON suggestions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to dev_log_posts" ON dev_log_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to forum_posts" ON forum_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to site_stats" ON site_stats
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update to admin_settings" ON admin_settings
    FOR UPDATE USING (true);

-- Create policies for public delete access (for admin functionality)
CREATE POLICY "Allow public delete from suggestions" ON suggestions
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete from dev_log_posts" ON dev_log_posts
    FOR DELETE USING (true);

-- Insert initial site stats
INSERT INTO site_stats (id, visitor_count, first_visit, last_updated) 
VALUES (1, 0, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- Basement + Quotes Support
-- =========================

-- Basement chat messages
CREATE TABLE IF NOT EXISTS basement_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author TEXT NOT NULL DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basement active users
CREATE TABLE IF NOT EXISTS basement_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    last_seen BIGINT NOT NULL,
    sid TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basement playlist (stores data URLs)
CREATE TABLE IF NOT EXISTS basement_playlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    src TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'audio/mpeg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table for added quotes in quotebook
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    date_added TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE basement_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY IF NOT EXISTS "Allow public read access to basement_chat" ON basement_chat
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access to basement_users" ON basement_users
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access to basement_playlist" ON basement_playlist
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access to quotes" ON quotes
    FOR SELECT USING (true);

-- Insert/update policies
CREATE POLICY IF NOT EXISTS "Allow public insert to basement_chat" ON basement_chat
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public insert to basement_users" ON basement_users
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public insert to basement_playlist" ON basement_playlist
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public insert to quotes" ON quotes
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public update to basement_users" ON basement_users
    FOR UPDATE USING (true);

-- Insert initial admin settings
INSERT INTO admin_settings (id, mood_description, home_thread, image_path, image_alt) 
VALUES (1, 'i want to see my girlfriend', '', 'images/avatar.JPG', '')
ON CONFLICT (id) DO NOTHING;

-- =========================
-- Chat Moderation Tables
-- =========================

-- Banned users table
CREATE TABLE IF NOT EXISTS basement_banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sid TEXT UNIQUE,
    name TEXT,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    banned_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Muted users table
CREATE TABLE IF NOT EXISTS basement_muted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sid TEXT UNIQUE,
    name TEXT,
    muted_until BIGINT,
    reason TEXT,
    muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    muted_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat settings table (for slow mode, lockdown, MOTD)
CREATE TABLE IF NOT EXISTS basement_chat_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    slow_mode_seconds INTEGER DEFAULT 0,
    lockdown_mode BOOLEAN DEFAULT false,
    motd TEXT DEFAULT '',
    pinned_message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to basement_chat for pinning and editing
ALTER TABLE basement_chat ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE basement_chat ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE basement_chat ADD COLUMN IF NOT EXISTS sid TEXT;

-- Add columns to basement_users for avatars and status
ALTER TABLE basement_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE basement_users ADD COLUMN IF NOT EXISTS is_kicked BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE basement_banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_chat_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read access to basement_banned_users" ON basement_banned_users
    FOR SELECT USING (true);
CREATE POLICY "Allow public read access to basement_muted_users" ON basement_muted_users
    FOR SELECT USING (true);
CREATE POLICY "Allow public read access to basement_chat_settings" ON basement_chat_settings
    FOR SELECT USING (true);

-- Admin-only write policies (for now, allow all - you can add auth later)
CREATE POLICY "Allow public insert to basement_banned_users" ON basement_banned_users
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to basement_muted_users" ON basement_muted_users
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete from basement_banned_users" ON basement_banned_users
    FOR DELETE USING (true);
CREATE POLICY "Allow public delete from basement_muted_users" ON basement_muted_users
    FOR DELETE USING (true);
CREATE POLICY "Allow public update to basement_chat_settings" ON basement_chat_settings
    FOR UPDATE USING (true);
CREATE POLICY "Allow public update to basement_chat for pinning" ON basement_chat
    FOR UPDATE USING (true);

-- Insert initial chat settings
INSERT INTO basement_chat_settings (id, slow_mode_seconds, lockdown_mode, motd) 
VALUES (1, 0, false, 'Welcome to the basement!')
ON CONFLICT (id) DO NOTHING;
