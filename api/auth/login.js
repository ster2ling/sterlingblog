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
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: e.message || 'Login failed' });
  }
};

