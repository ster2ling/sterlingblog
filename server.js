require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Helper functions for Supabase operations
async function getSiteStats() {
  const { data, error } = await supabase
    .from('site_stats')
    .select('*')
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw error;
  }
  
  return data || { visitorCount: 0, firstVisit: Date.now() };
}

async function updateSiteStats(stats) {
  const { data, error } = await supabase
    .from('site_stats')
    .upsert(stats, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getSuggestions() {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

async function addSuggestion(suggestion) {
  const { data, error } = await supabase
    .from('suggestions')
    .insert(suggestion)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteSuggestion(id) {
  const { error } = await supabase
    .from('suggestions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

async function getDevLogPosts() {
  const { data, error } = await supabase
    .from('dev_log_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

async function addDevLogPost(post) {
  const { data, error } = await supabase
    .from('dev_log_posts')
    .insert(post)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteDevLogPost(id) {
  const { error } = await supabase
    .from('dev_log_posts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Admin Settings functions
async function getAdminSettings() {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data || {
    mood_description: 'i want to see my girlfriend',
    home_thread: '',
    image_path: 'images/avatar.JPG',
    image_alt: ''
  };
}

async function updateAdminSettings(settings) {
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({ ...settings, id: 1 }, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Site Stats API
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getSiteStats();
        res.json({
            visitorCount: stats.visitor_count,
            firstVisit: stats.first_visit,
            lastUpdated: stats.last_updated
        });
    } catch (error) {
        console.error('Error getting site stats:', error);
        res.status(500).json({ error: 'Failed to read site stats' });
    }
});

app.post('/api/stats', async (req, res) => {
    try {
        console.log('Updating site stats with body:', req.body);
        const { visitorCount, firstVisit } = req.body;
        const currentStats = await getSiteStats();
        console.log('Current stats:', currentStats);
        
        const updatedStats = {
            id: 1, // Single row for site stats
            visitor_count: visitorCount || (currentStats.visitor_count || 0) + 1,
            first_visit: firstVisit || currentStats.first_visit || Date.now(),
            last_updated: Date.now()
        };
        
        console.log('New stats to save:', updatedStats);
        const stats = await updateSiteStats(updatedStats);
        console.log('Successfully updated site stats:', stats);
        res.json({
            visitorCount: stats.visitor_count,
            firstVisit: stats.first_visit,
            lastUpdated: stats.last_updated
        });
    } catch (error) {
        console.error('Error updating site stats:', error);
        res.status(500).json({ error: 'Failed to update site stats', details: error.message });
    }
});

// Suggestions API
app.get('/api/suggestions', async (req, res) => {
    try {
        const suggestions = await getSuggestions();
        res.json(suggestions);
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ error: 'Failed to read suggestions' });
    }
});

app.post('/api/suggestions', async (req, res) => {
    try {
        const { name, suggestion } = req.body;
        
        if (!suggestion) {
            return res.status(400).json({ error: 'Suggestion content is required' });
        }
        
        const newSuggestion = {
            name: name || 'Anonymous',
            suggestion: suggestion,
            timestamp: new Date().toLocaleString()
        };
        
        const result = await addSuggestion(newSuggestion);
        res.json(result);
    } catch (error) {
        console.error('Error adding suggestion:', error);
        res.status(500).json({ error: 'Failed to add suggestion' });
    }
});

app.delete('/api/suggestions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deleteSuggestion(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting suggestion:', error);
        res.status(500).json({ error: 'Failed to delete suggestion' });
    }
});

// Dev Log API
app.get('/api/devlog', async (req, res) => {
    try {
        const posts = await getDevLogPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error getting dev log posts:', error);
        res.status(500).json({ error: 'Failed to read dev log posts' });
    }
});

app.post('/api/devlog', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Post content is required' });
        }
        
        const now = new Date();
        const newPost = {
            content: content,
            date: now.toLocaleDateString(),
            hour: now.getHours(),
            timestamp: now.getTime()
        };
        
        const post = await addDevLogPost(newPost);
        res.json(post);
    } catch (error) {
        console.error('Error adding dev log post:', error);
        res.status(500).json({ error: 'Failed to add dev log post' });
    }
});

app.delete('/api/devlog/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deleteDevLogPost(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting dev log post:', error);
        res.status(500).json({ error: 'Failed to delete dev log post' });
    }
});

// Admin Settings API
app.get('/api/admin/settings', async (req, res) => {
    try {
        const settings = await getAdminSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting admin settings:', error);
        res.status(500).json({ error: 'Failed to get admin settings' });
    }
});

app.post('/api/admin/settings', async (req, res) => {
    try {
        console.log('Updating admin settings:', req.body);
        const settings = await updateAdminSettings(req.body);
        console.log('Successfully updated:', settings);
        res.json(settings);
    } catch (error) {
        console.error('Error updating admin settings:', error);
        res.status(500).json({ error: 'Failed to update admin settings', details: error.message });
    }
});

// Initialize server
async function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Using Supabase for data storage`);
    });
}

startServer().catch(console.error);
