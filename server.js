require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('.')); // Serve static files
// Simple SID generator
function generateSid() {
  return 'sid_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Ensure a sid cookie exists on each request
app.use((req, res, next) => {
  if (!req.cookies.sid) {
    const sid = generateSid();
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', path: '/' });
    req.cookies.sid = sid;
  }
  next();
});

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

// Forum functions
async function getForumPosts() {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

async function addForumPost(post) {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert(post)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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

// Forum API
app.get('/api/forum', async (req, res) => {
    try {
        const posts = await getForumPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error getting forum posts:', error);
        res.status(500).json({ error: 'Failed to read forum posts' });
    }
});

// Quotes helpers
async function getQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function addQuote(quote) {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteQuote(id) {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// Quotes API
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await getQuotes();
    res.json(quotes);
  } catch (error) {
    console.error('Error getting quotes:', error);
    res.status(500).json({ error: 'Failed to read quotes' });
  }
});

app.post('/api/quotes', async (req, res) => {
  try {
    const { quote, author, date_added } = req.body;
    if (!quote || !author) return res.status(400).json({ error: 'quote and author are required' });
    const saved = await addQuote({ quote, author, date_added: date_added || new Date().toLocaleDateString() });
    res.json(saved);
  } catch (error) {
    console.error('Error adding quote:', error);
    res.status(500).json({ error: 'Failed to add quote' });
  }
});

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    await deleteQuote(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

app.post('/api/forum', async (req, res) => {
    try {
        const { message, author } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        const now = new Date();
        const newPost = {
            message: message,
            author: author || 'Anonymous',
            timestamp: now.toISOString(),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString()
        };
        
        const post = await addForumPost(newPost);
        res.json(post);
    } catch (error) {
        console.error('Error adding forum post:', error);
        res.status(500).json({ error: 'Failed to add forum post' });
    }
});

// Basement: Chat, Users, Playlist
async function getBasementChat(limit = 100) {
  const { data, error } = await supabase
    .from('basement_chat')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

async function addBasementMessage(msg) {
  const { data, error } = await supabase
    .from('basement_chat')
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertBasementUser(user) {
  const { data, error } = await supabase
    .from('basement_users')
    .upsert(user, { onConflict: 'sid' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getBasementUsers() {
  const thirtySecondsAgo = Date.now() - 30 * 1000;
  const { data, error } = await supabase
    .from('basement_users')
    .select('*')
    .gte('last_seen', thirtySecondsAgo)
    .order('last_seen', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getBasementPlaylist() {
  const { data, error } = await supabase
    .from('basement_playlist')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function addBasementTrack(track) {
  const { data, error } = await supabase
    .from('basement_playlist')
    .insert(track)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Basement API Routes
app.get('/api/basement/chat', async (req, res) => {
  try {
    const since = parseInt(req.query.since || '0', 10);
    let messages = await getBasementChat();
    if (since) {
      messages = messages.filter(m => (m.created_at_ms || 0) > since);
    }
    res.json(messages);
  } catch (error) {
    console.error('Error getting basement chat:', error);
    res.status(500).json({ error: 'Failed to read chat' });
  }
});

app.post('/api/basement/chat', async (req, res) => {
  try {
    const { message, timestamp } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const sid = req.cookies.sid;
    
    // Check if user is banned
    const { data: banned } = await supabase
      .from('basement_banned_users')
      .select('*')
      .eq('sid', sid)
      .maybeSingle();
    
    if (banned) {
      return res.status(403).json({ error: 'You are banned from the chat', reason: banned.reason });
    }
    
    // Check if user is muted
    const { data: muted } = await supabase
      .from('basement_muted_users')
      .select('*')
      .eq('sid', sid)
      .maybeSingle();
    
    if (muted && muted.muted_until > Date.now()) {
      const timeLeft = Math.ceil((muted.muted_until - Date.now()) / 60000);
      return res.status(403).json({ error: `You are muted for ${timeLeft} more minutes`, reason: muted.reason });
    }
    
    // Get chat settings for slow mode check
    const { data: settings } = await supabase
      .from('basement_chat_settings')
      .select('slow_mode_seconds, lockdown_mode')
      .eq('id', 1)
      .maybeSingle();
    
    // Check lockdown mode
    if (settings && settings.lockdown_mode) {
      // Only allow admins (you can add admin check here)
      return res.status(403).json({ error: 'Chat is in lockdown mode - admin only' });
    }
    
    // Resolve author - first check if user is authenticated, then fall back to basement_users
    let authorName = 'Anonymous';
    
    // Check for authenticated session first
    const sessionToken = req.cookies.sessionToken;
    if (sessionToken) {
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', sessionToken)
        .gt('expires_at', Date.now())
        .maybeSingle();
      
      if (session && session.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('display_name, username')
          .eq('id', session.user_id)
          .maybeSingle();
        
        if (user) {
          authorName = user.display_name || user.username;
        }
      }
    }
    
    // Fall back to basement_users (for guests)
    if (authorName === 'Anonymous') {
      try {
        const { data: u } = await supabase
          .from('basement_users')
          .select('name, sid')
          .eq('sid', sid)
          .single();
        if (u && u.name) authorName = u.name;
      } catch (_) {}
    }
    
    const msg = {
      author: authorName,
      message,
      timestamp: timestamp || new Date().toLocaleTimeString(),
      created_at_ms: Date.now(),
      sid: sid
    };
    const saved = await addBasementMessage(msg);
    res.json(saved);
  } catch (error) {
    console.error('Error adding basement message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

app.delete('/api/basement/chat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('basement_chat')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting basement message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.get('/api/basement/users', async (req, res) => {
  try {
    const users = await getBasementUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting basement users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

app.post('/api/basement/users', async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const sid = req.cookies.sid;
    // Check for name taken by other sid
    const { data: existing } = await supabase
      .from('basement_users')
      .select('sid, name')
      .eq('name', name)
      .maybeSingle();
    if (existing && existing.sid && existing.sid !== sid) {
      return res.status(409).json({ error: 'Name is taken' });
    }
    const saved = await upsertBasementUser({ sid, name, status: status || 'online', last_seen: Date.now() });
    res.json(saved);
  } catch (error) {
    console.error('Error upserting basement user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/basement/playlist', async (req, res) => {
  try {
    const tracks = await getBasementPlaylist();
    res.json(tracks);
  } catch (error) {
    console.error('Error getting basement playlist:', error);
    res.status(500).json({ error: 'Failed to read playlist' });
  }
});

app.post('/api/basement/playlist', async (req, res) => {
  try {
    const { name, src, type } = req.body;
    if (!name || !src) return res.status(400).json({ error: 'Track name and src are required' });
    const track = await addBasementTrack({ name, src, type: type || 'audio/mpeg' });
    res.json(track);
  } catch (error) {
    console.error('Error adding basement track:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Basement Moderation Routes
app.get('/api/basement/moderation', async (req, res) => {
  try {
    const { action } = req.query;
    
    if (action === 'banned') {
      const { data, error } = await supabase
        .from('basement_banned_users')
        .select('*')
        .order('banned_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }
    
    if (action === 'muted') {
      const { data, error } = await supabase
        .from('basement_muted_users')
        .select('*')
        .order('muted_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }
    
    if (action === 'settings') {
      const { data, error } = await supabase
        .from('basement_chat_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return res.json(data || { slow_mode_seconds: 0, lockdown_mode: false, motd: '' });
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error in moderation GET:', error);
    res.status(500).json({ error: 'Failed to fetch moderation data' });
  }
});

app.post('/api/basement/moderation', async (req, res) => {
  try {
    const { action } = req.query;
    
    if (action === 'ban') {
      const { sid, name, reason } = req.body;
      if (!sid) return res.status(400).json({ error: 'SID required' });
      
      const { data, error } = await supabase
        .from('basement_banned_users')
        .insert({ sid, name, reason: reason || 'No reason provided', banned_by: 'Admin' })
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    if (action === 'mute') {
      const { sid, name, duration, reason } = req.body;
      if (!sid) return res.status(400).json({ error: 'SID required' });
      
      const mutedUntil = Date.now() + (duration || 10) * 60 * 1000;
      const { data, error } = await supabase
        .from('basement_muted_users')
        .insert({ sid, name, muted_until: mutedUntil, reason: reason || 'No reason provided', muted_by: 'Admin' })
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    if (action === 'kick') {
      const { sid } = req.body;
      if (!sid) return res.status(400).json({ error: 'SID required' });
      
      await supabase.from('basement_users').delete().eq('sid', sid);
      return res.json({ success: true });
    }
    
    if (action === 'clear') {
      // Delete all chat messages
      // Using .neq() to delete all rows (Supabase requires a filter)
      const { error } = await supabase.from('basement_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        // Fallback: try to delete with a different approach if the above fails
        console.error('Clear chat error:', error);
        // Get all message IDs and delete them
        const { data: messages } = await supabase.from('basement_chat').select('id');
        if (messages && messages.length > 0) {
          const ids = messages.map(m => m.id);
          const { error: deleteError } = await supabase.from('basement_chat').delete().in('id', ids);
          if (deleteError) throw deleteError;
        }
      }
      return res.json({ success: true });
    }
    
    if (action === 'settings') {
      const { slow_mode_seconds, lockdown_mode, motd } = req.body;
      
      const payload = {};
      if (slow_mode_seconds !== undefined) payload.slow_mode_seconds = slow_mode_seconds;
      if (lockdown_mode !== undefined) payload.lockdown_mode = lockdown_mode;
      if (motd !== undefined) payload.motd = motd;
      payload.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('basement_chat_settings')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    if (action === 'pin') {
      const { messageId } = req.body;
      if (!messageId) return res.status(400).json({ error: 'Message ID required' });
      
      await supabase.from('basement_chat').update({ is_pinned: false }).eq('is_pinned', true);
      const { data, error } = await supabase
        .from('basement_chat')
        .update({ is_pinned: true })
        .eq('id', messageId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    if (action === 'unpin') {
      const { messageId } = req.body;
      const { data, error } = await supabase
        .from('basement_chat')
        .update({ is_pinned: false })
        .eq('id', messageId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error in moderation POST:', error);
    res.status(500).json({ error: 'Failed to perform moderation action' });
  }
});

app.delete('/api/basement/moderation', async (req, res) => {
  try {
    const { action } = req.query;
    
    if (action === 'unban') {
      const { sid } = req.body || {};
      if (!sid) return res.status(400).json({ error: 'SID required' });
      
      const { error } = await supabase
        .from('basement_banned_users')
        .delete()
        .eq('sid', sid);
      if (error) throw error;
      return res.json({ success: true });
    }
    
    if (action === 'unmute') {
      const { sid } = req.body || {};
      if (!sid) return res.status(400).json({ error: 'SID required' });
      
      const { error } = await supabase
        .from('basement_muted_users')
        .delete()
        .eq('sid', sid);
      if (error) throw error;
      return res.json({ success: true });
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error in moderation DELETE:', error);
    res.status(500).json({ error: 'Failed to delete moderation data' });
  }
});

// Authentication Routes
const bcrypt = require('bcrypt');
const crypto = require('crypto');

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, displayName } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        email: email || null,
        password_hash: passwordHash,
        display_name: displayName || username,
        is_admin: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt
      });
    
    res.cookie('sessionToken', sessionToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    
    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt
      });
    
    res.cookie('sessionToken', sessionToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies.sessionToken;
    
    if (token) {
      await supabase
        .from('sessions')
        .delete()
        .eq('token', token);
    }
    
    res.clearCookie('sessionToken');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.cookies.sessionToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated', authenticated: false });
    }
    
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .gt('expires_at', Date.now())
      .maybeSingle();
    
    if (error || !session || !session.user_id) {
      return res.status(401).json({ error: 'Invalid or expired session', authenticated: false });
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, is_admin')
      .eq('id', session.user_id)
      .maybeSingle();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'User not found', authenticated: false });
    }
    
    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message || 'Verification failed', authenticated: false });
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
