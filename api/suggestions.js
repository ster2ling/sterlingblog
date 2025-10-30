const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('suggestions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { name, suggestion } = req.body || {};
      if (!suggestion) return res.status(400).json({ error: 'Suggestion content is required' });
      const payload = { name: name || 'Anonymous', suggestion, timestamp: new Date().toLocaleString() };
      const { data, error } = await sb.from('suggestions').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await sb.from('suggestions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('suggestions api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


