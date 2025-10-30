const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('dev_log_posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { content } = req.body || {};
      if (!content) return res.status(400).json({ error: 'Post content is required' });
      const now = new Date();
      const payload = { content, date: now.toLocaleDateString(), hour: now.getHours(), timestamp: now.getTime() };
      const { data, error } = await sb.from('dev_log_posts').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      const { error } = await sb.from('dev_log_posts').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('devlog api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


