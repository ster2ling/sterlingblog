const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to get SID from cookies
function getSidFromCookie(req) {
  const cookies = req.headers.cookie || '';
  const sidMatch = cookies.match(/sid=([^;]+)/);
  return sidMatch ? sidMatch[1] : null;
}

// Generate a SID if one doesn't exist
function generateSid() {
  return 'sid_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      const { data, error } = await sb
        .from('basement_users')
        .select('*')
        .gte('last_seen', thirtySecondsAgo)
        .order('last_seen', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { name, status } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name is required' });
      
      // Get or generate SID
      let sid = getSidFromCookie(req);
      if (!sid) {
        sid = generateSid();
        // Set SID cookie
        res.setHeader('Set-Cookie', `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`);
      }
      
      // Check if name is taken by another SID
      const { data: existing } = await sb
        .from('basement_users')
        .select('sid, name')
        .eq('name', name)
        .maybeSingle();
      
      if (existing && existing.sid && existing.sid !== sid) {
        return res.status(409).json({ error: 'Name is taken' });
      }
      
      // Upsert user with SID
      const payload = { 
        sid, 
        name, 
        status: status || 'online', 
        last_seen: Date.now() 
      };
      
      const { data, error } = await sb
        .from('basement_users')
        .upsert(payload, { onConflict: 'sid' })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/users api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


