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
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
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
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(500).json({ error: e.message || 'Logout failed' });
  }
};


