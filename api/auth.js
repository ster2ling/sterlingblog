const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to get session token from cookies
function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/sessionToken=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

module.exports = async function handler(req, res) {
  try {
    const { action } = req.query; // login, register, logout, verify
    
    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Find user
      const { data: user, error } = await sb
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      
      const { data: session, error: sessionError } = await sb
        .from('sessions')
        .insert({
          user_id: user.id,
          token: sessionToken,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      // Set session cookie
      res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
      
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin
        },
        session: {
          token: sessionToken,
          expires_at: expiresAt
        }
      });
    }
    
    // REGISTER
    if (action === 'register' && req.method === 'POST') {
      const { username, password, email, displayName } = req.body || {};
      
      // Validation
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // Check if username already exists
      const { data: existing } = await sb
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const { data: user, error } = await sb
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
      
      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      
      const { data: session, error: sessionError } = await sb
        .from('sessions')
        .insert({
          user_id: user.id,
          token: sessionToken,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      // Set session cookie
      res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
      
      return res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin
        },
        session: {
          token: sessionToken,
          expires_at: expiresAt
        }
      });
    }
    
    // LOGOUT
    if (action === 'logout' && req.method === 'POST') {
      const token = getSessionToken(req);
      
      if (token) {
        // Delete session from database
        await sb
          .from('sessions')
          .delete()
          .eq('token', token);
      }
      
      // Clear session cookie
      res.setHeader('Set-Cookie', 'sessionToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      
      return res.status(200).json({ success: true });
    }
    
    // VERIFY
    if (action === 'verify' && req.method === 'GET') {
      const token = getSessionToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated', authenticated: false });
      }
      
      // Find session
      const { data: session, error: sessionError } = await sb
        .from('sessions')
        .select('user_id')
        .eq('token', token)
        .gt('expires_at', Date.now())
        .maybeSingle();
      
      if (sessionError || !session || !session.user_id) {
        return res.status(401).json({ error: 'Invalid or expired session', authenticated: false });
      }
      
      // Get user info
      const { data: user, error: userError } = await sb
        .from('users')
        .select('id, username, display_name, avatar_url, is_admin')
        .eq('id', session.user_id)
        .maybeSingle();
      
      if (userError || !user) {
        return res.status(401).json({ error: 'User not found', authenticated: false });
      }
      
      // Return user info
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
    }
    
    // Default: method not allowed
    if (action) {
      return res.status(405).json({ error: `Method not allowed for action: ${action}` });
    }
    
    return res.status(400).json({ error: 'Action parameter required (login, register, logout, verify)' });
  } catch (e) {
    console.error('Auth error:', e);
    return res.status(500).json({ error: e.message || 'Auth operation failed' });
  }
};

