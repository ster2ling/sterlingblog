const { createClient } = require('@supabase/supabase-js');

// Use service role on server-side only. On Vercel, set env vars.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { quote, author, date_added } = req.body || {};
      if (!quote || !author) {
        return res.status(400).json({ error: 'quote and author are required' });
      }
      const { data, error } = await supabase
        .from('quotes')
        .insert({ quote, author, date_added: date_added || new Date().toLocaleDateString() })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('quotes api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


