const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('site_stats').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      const d = data || { visitor_count: 0, first_visit: Date.now(), last_updated: Date.now() };
      return res.status(200).json({
        visitorCount: d.visitor_count,
        firstVisit: d.first_visit,
        lastUpdated: d.last_updated,
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { data: current } = await sb.from('site_stats').select('*').single();
      const updated = {
        id: 1,
        visitor_count: body.visitorCount ?? ((current?.visitor_count || 0) + 1),
        first_visit: body.firstVisit ?? current?.first_visit ?? Date.now(),
        last_updated: Date.now(),
      };
      const { data, error } = await sb.from('site_stats').upsert(updated, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return res.status(200).json({
        visitorCount: data.visitor_count,
        firstVisit: data.first_visit,
        lastUpdated: data.last_updated,
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('stats api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


