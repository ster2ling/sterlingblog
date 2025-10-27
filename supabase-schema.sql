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

-- Enable Row Level Security (RLS)
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_log_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to site_stats" ON site_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to suggestions" ON suggestions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dev_log_posts" ON dev_log_posts
    FOR SELECT USING (true);

-- Create policies for public insert/update access
CREATE POLICY "Allow public insert to suggestions" ON suggestions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to dev_log_posts" ON dev_log_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to site_stats" ON site_stats
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
