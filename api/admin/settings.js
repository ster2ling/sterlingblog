const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(
        data || {
          mood_description: '',
          home_thread: '',
          image_path: 'images/avatar.JPG',
          image_alt: 'Untitled'
        }
      );
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const payload = {
        id: 1,
        mood_description: body.mood_description ?? '',
        home_thread: body.home_thread ?? '',
        image_path: body.image_path ?? 'images/avatar.JPG',
        image_alt: body.image_alt ?? 'Untitled'
      };
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('admin/settings api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


