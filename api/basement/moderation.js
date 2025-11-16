const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to get session token and verify admin
async function verifyAdmin(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/sessionToken=([^;]+)/);
  if (!tokenMatch) return null;
  
  const token = tokenMatch[1];
  const { data: session } = await sb
    .from('sessions')
    .select('user_id')
    .eq('token', token)
    .gt('expires_at', Date.now())
    .maybeSingle();
  
  if (!session || !session.user_id) return null;
  
  const { data: user } = await sb
    .from('users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle();
  
  if (!user || !user.is_admin) return null;
  return user;
}

module.exports = async function handler(req, res) {
  try {
    const { action } = req.query; // ban, unban, mute, unmute, kick, clear, settings
    
    if (req.method === 'POST') {
      // Verify admin for all POST actions
      const admin = await verifyAdmin(req);
      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      if (action === 'ban') {
        const { sid, name, reason } = req.body;
        if (!sid) return res.status(400).json({ error: 'SID required' });
        
        const { data, error } = await sb
          .from('basement_banned_users')
          .insert({ sid, name, reason: reason || 'No reason provided', banned_by: 'Admin' })
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (action === 'mute') {
        const { sid, name, duration, reason } = req.body; // duration in minutes
        if (!sid) return res.status(400).json({ error: 'SID required' });
        
        const mutedUntil = Date.now() + (duration || 10) * 60 * 1000;
        const { data, error } = await sb
          .from('basement_muted_users')
          .insert({ sid, name, muted_until: mutedUntil, reason: reason || 'No reason provided', muted_by: 'Admin' })
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (action === 'kick') {
        const { sid } = req.body;
        if (!sid) return res.status(400).json({ error: 'SID required' });
        
        // Mark user as kicked and delete from active users
        await sb.from('basement_users').delete().eq('sid', sid);
        
        return res.status(200).json({ success: true });
      }
      
      if (action === 'clear') {
        // Delete all chat messages
        // Using .neq() to delete all rows (Supabase requires a filter)
        const { error } = await sb.from('basement_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          // Fallback: try to delete with a different approach if the above fails
          console.error('Clear chat error:', error);
          // Get all message IDs and delete them
          const { data: messages } = await sb.from('basement_chat').select('id');
          if (messages && messages.length > 0) {
            const ids = messages.map(m => m.id);
            const { error: deleteError } = await sb.from('basement_chat').delete().in('id', ids);
            if (deleteError) throw deleteError;
          }
        }
        return res.status(200).json({ success: true });
      }
      
      if (action === 'settings') {
        const { slow_mode_seconds, lockdown_mode, motd } = req.body;
        
        const payload = {};
        if (slow_mode_seconds !== undefined) payload.slow_mode_seconds = slow_mode_seconds;
        if (lockdown_mode !== undefined) payload.lockdown_mode = lockdown_mode;
        if (motd !== undefined) payload.motd = motd;
        
        const { data, error } = await sb
          .from('basement_chat_settings')
          .update(payload)
          .eq('id', 1)
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (action === 'pin') {
        const { messageId } = req.body;
        if (!messageId) return res.status(400).json({ error: 'Message ID required' });
        
        // Unpin all messages first
        await sb.from('basement_chat').update({ is_pinned: false }).eq('is_pinned', true);
        
        // Pin the selected message
        const { data, error } = await sb
          .from('basement_chat')
          .update({ is_pinned: true })
          .eq('id', messageId)
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (action === 'unpin') {
        const { messageId } = req.body;
        
        const { data, error } = await sb
          .from('basement_chat')
          .update({ is_pinned: false })
          .eq('id', messageId)
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
    }
    
    if (req.method === 'GET') {
      if (action === 'banned') {
        const { data, error } = await sb
          .from('basement_banned_users')
          .select('*')
          .order('banned_at', { ascending: false });
        
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      
      if (action === 'muted') {
        const { data, error } = await sb
          .from('basement_muted_users')
          .select('*')
          .order('muted_at', { ascending: false });
        
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      
      if (action === 'settings') {
        const { data, error } = await sb
          .from('basement_chat_settings')
          .select('*')
          .eq('id', 1)
          .single();
        
        if (error) throw error;
        return res.status(200).json(data || { slow_mode_seconds: 0, lockdown_mode: false, motd: '' });
      }
    }
    
    if (req.method === 'DELETE') {
      // Verify admin for all DELETE actions
      const admin = await verifyAdmin(req);
      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      if (action === 'unban') {
        const { sid } = req.body || {};
        if (!sid) return res.status(400).json({ error: 'SID required' });
        
        const { error } = await sb
          .from('basement_banned_users')
          .delete()
          .eq('sid', sid);
        
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
      
      if (action === 'unmute') {
        const { sid } = req.body || {};
        if (!sid) return res.status(400).json({ error: 'SID required' });
        
        const { error } = await sb
          .from('basement_muted_users')
          .delete()
          .eq('sid', sid);
        
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }
    
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('basement/moderation api error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};

