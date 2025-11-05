const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
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
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: e.message || 'Registration failed' });
  }
};

