const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
    const { action } = req.query; // ban, unban, mute, unmute, kick, clear, settings
    
    if (req.method === 'POST') {
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
        const { error } = await sb.from('basement_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
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

