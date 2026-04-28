const supabase = require('../config/database');

class Subject {
  static normalizeData(data) {
    if (Array.isArray(data)) {
      return data.map(item => Subject.normalizeData(item));
    }
    return {
      id: data.id,
      code: data.CODE ?? data.code ?? null,
      name: data.name,
      units: data.units,
      hours_per_week: data.hours_per_week,
      department_id: data.department_id,
      department: data.department ?? null,
      program: data.program ?? null,
      course_no: data['Course_No.'] ?? data.course_no ?? null,
      section: data.SECTION ?? data.section ?? null,
    };
  }

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
      department_id: subjectData.department_id,
      program: subjectData.program,
    };
  }

  static async getAll(options = {}) {
    const { department } = options;

    let query = supabase
      .from('subjects')
      .select('*');

    if (department) {
      // Filter by department_name (e.g., "SEAIT", "Business", etc.)
      query = query.eq('department', department);
    }

    const { data, error } = await query.order('id');

    if (error) throw error;
    return Subject.normalizeData(data);
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return Subject.normalizeData(data);
  }

  static async create(subjectData) {
    const payload = Subject.buildPayload(subjectData);
    const { data, error } = await supabase
      .from('subjects')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return Subject.normalizeData(data);
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
    return Subject.normalizeData(data);
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return Subject.normalizeData(data);
  }
}

module.exports = Subject;
