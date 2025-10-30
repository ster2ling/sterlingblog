const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const { data, error } = await sb
        .from('basement_users')
        .select('*')
        .gte('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { name, status } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const payload = { name, status: status || 'online', last_seen: Date.now() };
      const { data, error } = await sb.from('basement_users').upsert(payload, { onConflict: 'name' }).select().single();
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


