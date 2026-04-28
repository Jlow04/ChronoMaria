const supabase = require('../config/database');

class Department {
  static async getAll() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('department_name');

    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('department_id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByName(name) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('department_name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(departmentData) {
    const { department_name, department_program } = departmentData;
    const { data, error } = await supabase
      .from('departments')
      .insert([{ department_name, department_program }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, departmentData) {
    const { department_name, department_program } = departmentData;
    const { data, error } = await supabase
      .from('departments')
      .update({ department_name, department_program })
      .eq('department_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = Department;
