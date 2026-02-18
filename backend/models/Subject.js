const supabase = require('../config/database');

class Subject {
  static async getAll() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async create(subjectData) {
    const { code, name, units, hours_per_week, department } = subjectData;
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ code, name, units, hours_per_week, department }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, subjectData) {
    const { code, name, units, hours_per_week, department } = subjectData;
    const { data, error } = await supabase
      .from('subjects')
      .update({ code, name, units, hours_per_week, department })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = Subject;
