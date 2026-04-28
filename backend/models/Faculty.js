const supabase = require('../config/database');

class Faculty {
  static async getAll(options = {}) {
    const {
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      department
    } = options;

    const allowedSortFields = ['id', 'name', 'email', 'department_id', 'max_units'];
    const orderColumn = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const ascending = sortOrder !== 'desc';

    let query = supabase
      .from('faculty')
      .select('*');

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    if (department) {
      // Filter by department_name (e.g., "SEAIT", "Business", etc.)
      query = query.eq('department', department);
    }

    const { data, error } = await query
      .order(orderColumn, { ascending })
      .order('id', { ascending: true });

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
    const { name, email, department_id, max_units, preferred_subjects } = facultyData;
    const { data, error } = await supabase
      .from('faculty')
      .insert([{ name, email, department_id, max_units, preferred_subjects }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, facultyData) {
    const { name, email, department_id, max_units, preferred_subjects } = facultyData;
    const { data, error } = await supabase
      .from('faculty')
      .update({ name, email, department_id, max_units, preferred_subjects })
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
