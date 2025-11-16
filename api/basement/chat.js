const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to get SID from cookies
function getSidFromCookie(req) {
  const cookies = req.headers.cookie || '';
  const sidMatch = cookies.match(/sid=([^;]+)/);
  return sidMatch ? sidMatch[1] : null;
}

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
      const { message } = req.body || {};
      if (!message) return res.status(400).json({ error: 'Message is required' });
      
      const sid = getSidFromCookie(req);
      
      // Check if user is banned
      const { data: banned } = await sb
        .from('basement_banned_users')
        .select('*')
        .eq('sid', sid)
        .maybeSingle();
      
      if (banned) {
        return res.status(403).json({ error: 'You are banned from the chat', reason: banned.reason });
      }
      
      // Check if user is muted
      const { data: muted } = await sb
        .from('basement_muted_users')
        .select('*')
        .eq('sid', sid)
        .maybeSingle();
      
      if (muted && muted.muted_until > Date.now()) {
        const timeLeft = Math.ceil((muted.muted_until - Date.now()) / 60000);
        return res.status(403).json({ error: `You are muted for ${timeLeft} more minutes`, reason: muted.reason });
      }
      
      // Get chat settings for lockdown mode
      const { data: settings } = await sb
        .from('basement_chat_settings')
        .select('lockdown_mode')
        .eq('id', 1)
        .maybeSingle();
      
      // Check lockdown mode
      if (settings && settings.lockdown_mode) {
        return res.status(403).json({ error: 'Chat is in lockdown mode - admin only' });
      }
      
      // Check slow mode
      if (settings && settings.slow_mode_seconds > 0) {
        const { data: lastMsg } = await sb
          .from('basement_chat')
          .select('created_at_ms')
          .eq('sid', sid)
          .order('created_at_ms', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastMsg) {
          const timeSinceLastMsg = (Date.now() - lastMsg.created_at_ms) / 1000;
          if (timeSinceLastMsg < settings.slow_mode_seconds) {
            const waitTime = Math.ceil(settings.slow_mode_seconds - timeSinceLastMsg);
            return res.status(429).json({ error: `Slow mode: wait ${waitTime} more seconds` });
          }
        }
      }
      
      // Resolve author - first check if user is authenticated, then fall back to basement_users
      let authorName = 'Anonymous';
      
      // Check for authenticated session first
      const cookies = req.headers.cookie || '';
      const tokenMatch = cookies.match(/sessionToken=([^;]+)/);
      if (tokenMatch) {
        const { data: session } = await sb
          .from('sessions')
          .select('user_id')
          .eq('token', tokenMatch[1])
          .gt('expires_at', Date.now())
          .maybeSingle();
        
        if (session && session.user_id) {
          const { data: user } = await sb
            .from('users')
            .select('display_name, username')
            .eq('id', session.user_id)
            .maybeSingle();
          
          if (user) {
            authorName = user.display_name || user.username;
          }
        }
      }
      
      // Fall back to basement_users (for guests)
      if (authorName === 'Anonymous') {
        try {
          const { data: u } = await sb
            .from('basement_users')
            .select('name, sid')
            .eq('sid', sid)
            .single();
          if (u && u.name) authorName = u.name;
        } catch (_) {}
      }
      
      const payload = { 
        author: authorName, 
        message, 
        timestamp: new Date().toLocaleTimeString(), 
        created_at_ms: Date.now(),
        sid: sid
      };
      const { data, error } = await sb.from('basement_chat').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Message ID required' });
      }
      
      const { error } = await sb
        .from('basement_chat')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/chat api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


