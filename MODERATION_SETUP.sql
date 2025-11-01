-- Run this SQL in your Supabase SQL Editor
-- Step 1: Create new tables

CREATE TABLE IF NOT EXISTS basement_banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sid TEXT UNIQUE,
    name TEXT,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    banned_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS basement_chat_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    slow_mode_seconds INTEGER DEFAULT 0,
    lockdown_mode BOOLEAN DEFAULT false,
    motd TEXT DEFAULT '',
    pinned_message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add new columns to existing tables (run these one at a time if needed)
-- For basement_chat table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_chat' AND column_name='is_pinned') THEN
        ALTER TABLE basement_chat ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_chat' AND column_name='edited_at') THEN
        ALTER TABLE basement_chat ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_chat' AND column_name='sid') THEN
        ALTER TABLE basement_chat ADD COLUMN sid TEXT;
    END IF;
END $$;

-- For basement_users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_users' AND column_name='avatar_url') THEN
        ALTER TABLE basement_users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='basement_users' AND column_name='is_kicked') THEN
        ALTER TABLE basement_users ADD COLUMN is_kicked BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 3: Enable RLS
ALTER TABLE basement_banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE basement_chat_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (note: no IF NOT EXISTS for policies in PostgreSQL)
CREATE POLICY "Allow public read access to basement_banned_users" ON basement_banned_users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to basement_muted_users" ON basement_muted_users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to basement_chat_settings" ON basement_chat_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to basement_banned_users" ON basement_banned_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to basement_muted_users" ON basement_muted_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete from basement_banned_users" ON basement_banned_users FOR DELETE USING (true);
CREATE POLICY "Allow public delete from basement_muted_users" ON basement_muted_users FOR DELETE USING (true);
CREATE POLICY "Allow public update to basement_chat_settings" ON basement_chat_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public update to basement_chat for pinning" ON basement_chat FOR UPDATE USING (true);

-- Step 5: Insert initial settings
INSERT INTO basement_chat_settings (id, slow_mode_seconds, lockdown_mode, motd) 
VALUES (1, 0, false, 'Welcome to the basement!')
ON CONFLICT (id) DO NOTHING;

