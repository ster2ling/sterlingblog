const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const since = parseInt(req.query.since || '0', 10);
      let { data, error } = await sb.from('basement_chat').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      data = (data || []).reverse();
      if (since) data = data.filter(m => (m.created_at_ms || 0) > since);
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { message, author } = req.body || {};
      if (!message) return res.status(400).json({ error: 'Message is required' });
      const payload = { author: author || 'Anonymous', message, timestamp: new Date().toLocaleTimeString(), created_at_ms: Date.now() };
      const { data, error } = await sb.from('basement_chat').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/chat api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


