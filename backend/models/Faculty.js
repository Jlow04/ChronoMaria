const supabase = require('../config/database');

class Faculty {
  static async getAll() {
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async create(facultyData) {
    const { name, email, department, max_units, preferred_subjects } = facultyData;
    const { data, error } = await supabase
      .from('faculty')
      .insert([{ name, email, department, max_units, preferred_subjects }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, facultyData) {
    const { name, email, department, max_units, preferred_subjects } = facultyData;
    const { data, error } = await supabase
      .from('faculty')
      .update({ name, email, department, max_units, preferred_subjects })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('faculty')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = Faculty;
