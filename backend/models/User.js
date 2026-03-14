const supabase = require('../config/database');

class User {
  static async getByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  }
}

module.exports = User;
