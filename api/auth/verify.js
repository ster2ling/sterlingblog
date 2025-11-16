const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to get session token from cookies
function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/sessionToken=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
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
  } catch (e) {
    console.error('Verify error:', e);
    return res.status(500).json({ error: e.message || 'Verification failed', authenticated: false });
  }
};


