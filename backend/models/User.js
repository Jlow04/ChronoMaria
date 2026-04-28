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

  static async getByUsernameWithDepartment(username) {
    const user = await User.getByUsername(username);

    if (!user || !user.department_id) {
      return user;
    }

    // Fetch department info
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('department_id, department_name, department_program')
      .eq('department_id', user.department_id)
      .single();

    if (deptError) {
      console.warn('Could not fetch department:', deptError);
      return user;
    }

    return {
      ...user,
      department_name: dept.department_name,
      department_program: dept.department_program
    };
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id');

    if (error) throw error;
    return data;
  }

  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = User;
