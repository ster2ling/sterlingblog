const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('forum_posts').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { message, author } = req.body || {};
      if (!message) return res.status(400).json({ error: 'Message content is required' });
      const now = new Date();
      const payload = { message, author: author || 'Anonymous', timestamp: now.toISOString(), date: now.toLocaleDateString(), time: now.toLocaleTimeString() };
      const { data, error } = await sb.from('forum_posts').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('forum api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


