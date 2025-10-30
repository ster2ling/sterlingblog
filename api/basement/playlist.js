const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('basement_playlist').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { name, src, type } = req.body || {};
      if (!name || !src) return res.status(400).json({ error: 'Track name and src are required' });
      const { data, error } = await sb.from('basement_playlist').insert({ name, src, type: type || 'audio/mpeg' }).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/playlist api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


