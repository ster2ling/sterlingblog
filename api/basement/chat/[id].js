const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (req.method === 'DELETE') {
      const { error } = await sb
        .from('basement_chat')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/chat/[id] api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};

