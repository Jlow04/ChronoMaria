const axios = require('axios');
const supabase = require('../config/database');

exports.generateSchedule = async (req, res) => {
  try {
    const { faculty, subjects, rooms, constraints } = req.body;
    const safeConstraints = {
      max_generations: Math.min(Number(constraints?.max_generations || 300), 400),
      population_size: Math.min(Number(constraints?.population_size || 60), 80),
      mutation_rate: Number(constraints?.mutation_rate || 0.1),
      max_runtime_seconds: Math.min(Number(constraints?.max_runtime_seconds || 20), 30),
    };

    // Call Python genetic algorithm service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${pythonServiceUrl}/generate`, {
      faculty,
      subjects,
      rooms,
      constraints: safeConstraints
    }, {
      timeout: Number(process.env.GA_REQUEST_TIMEOUT_MS || 45000)
    });

    res.json({
      success: true,
      schedule: response.data.schedule,
      fitness: response.data.fitness,
      generations: response.data.generations
    });
  } catch (error) {
    const details = error.response?.data?.error || error.response?.data?.details || error.message;
    console.error('Error generating schedule:', details);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details
    });
  }
};

exports.getScheduleCount = async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('schedules')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get schedule count', details: error.message });
  }
};

exports.getMasterSchedule = async (req, res) => {
  try {
    const normalizeSubject = (subject) => {
      if (!subject) return null;
      return {
        ...subject,
        course_no: subject.course_no || subject['Course_No.'] || null,
        code: subject.code || subject.CODE || null,
        section: subject.section || subject.SECTION || null,
      };
    };

    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (scheduleError) throw scheduleError;
    if (!schedules || schedules.length === 0) {
      return res.json({ schedule: null, items: [] });
    }

    const schedule = schedules[0];
    const { data: items, error: itemsError } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('schedule_id', schedule.id)
      .order('id', { ascending: true });

    if (itemsError) throw itemsError;

    const subjectIds = [...new Set((items || []).map((item) => item.subject_id).filter(Boolean))];
    const facultyIds = [...new Set((items || []).map((item) => item.faculty_id).filter(Boolean))];
    const roomIds = [...new Set((items || []).map((item) => item.room_id).filter(Boolean))];

    const [subjectsResult, facultyResult, roomsResult] = await Promise.all([
      subjectIds.length > 0
        ? supabase.from('subjects').select('*').in('id', subjectIds)
        : Promise.resolve({ data: [], error: null }),
      facultyIds.length > 0
        ? supabase.from('faculty').select('*').in('id', facultyIds)
        : Promise.resolve({ data: [], error: null }),
      roomIds.length > 0
        ? supabase.from('rooms').select('*').in('id', roomIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (subjectsResult.error) throw subjectsResult.error;
    if (facultyResult.error) throw facultyResult.error;
    if (roomsResult.error) throw roomsResult.error;

    const subjectsById = new Map((subjectsResult.data || []).map((row) => [row.id, row]));
    const facultyById = new Map((facultyResult.data || []).map((row) => [row.id, row]));
    const roomsById = new Map((roomsResult.data || []).map((row) => [row.id, row]));

    const rows = (items || []).map((item) => {
      const subject = normalizeSubject(subjectsById.get(item.subject_id) || null);
      const faculty = facultyById.get(item.faculty_id) || null;
      const room = roomsById.get(item.room_id) || null;

      return {
        id: item.id,
        course_no: item.course_no || null,
        section: item.section || null,
        day_of_week: item.day_of_week,
        time_slot: item.time_slot,
        subject,
        faculty,
        room,
      };
    });

    return res.json({ schedule, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch master schedule', details: error.message });
  }
};

exports.validateSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    // Basic validation logic
    const conflicts = [];
    
    // Check for time conflicts, room conflicts, faculty conflicts
    // This is a placeholder - implement actual validation logic
    
    res.json({
      valid: conflicts.length === 0,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
