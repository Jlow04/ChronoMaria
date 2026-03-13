const supabase = require('../config/database');

class Subject {
  static buildPayload(subjectData) {
    const courseNo = subjectData.course_no ?? subjectData['Course_No.'] ?? null;
    const code = subjectData.code ?? subjectData.CODE ?? null;
    const section = subjectData.section ?? subjectData.SECTION ?? null;

    return {
      'Course_No.': courseNo,
      CODE: code,
      SECTION: section,
      name: subjectData.name,
      units: subjectData.units,
      hours_per_week: subjectData.hours_per_week,
      department: subjectData.department,
    };
  }

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
    const payload = Subject.buildPayload(subjectData);
    const { data, error } = await supabase
      .from('subjects')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, subjectData) {
    const payload = Subject.buildPayload(subjectData);
    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
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
