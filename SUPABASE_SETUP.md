# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a project name and database password
4. Wait for the project to be created

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env` file in your project root with:

```
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3001
```

## Step 3: Set Up Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to create the tables and policies

## Step 4: Test the Setup

1. Start your server: `npm start`
2. Test the API endpoints:
   - `GET http://localhost:3001/api/stats`
   - `POST http://localhost:3001/api/suggestions`
   - `GET http://localhost:3001/api/devlog`

## Step 5: Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy!

## Troubleshooting

- Make sure RLS policies are set up correctly
- Check that your API keys are correct
- Verify tables were created successfully
- Check Supabase logs for any errors
