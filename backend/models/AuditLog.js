const supabase = require('../config/database');

class AuditLog {
  static async create(auditData) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([auditData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getByAction(action) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

module.exports = AuditLog;
