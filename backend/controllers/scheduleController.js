const axios = require('axios');

const toBoundedInt = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(Math.round(parsed), max));
};

const toBoundedFloat = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
};

const normalizeConstraintPayload = (constraints = {}) => {
  return {
    max_generations: toBoundedInt(constraints.max_generations, 300, 10, 400),
    population_size: toBoundedInt(constraints.population_size, 60, 10, 80),
    mutation_rate: toBoundedFloat(constraints.mutation_rate, 0.1, 0.01, 0.5),
    max_runtime_seconds: toBoundedInt(constraints.max_runtime_seconds, 20, 5, 30),
  };
};

exports.generateSchedule = async (req, res) => {
  try {
    const { faculty, subjects, rooms, constraints } = req.body || {};

    if (!Array.isArray(faculty) || !Array.isArray(subjects) || !Array.isArray(rooms)) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'faculty, subjects, and rooms must be arrays',
      });
    }

    if (faculty.length === 0 || subjects.length === 0 || rooms.length === 0) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'faculty, subjects, and rooms cannot be empty',
      });
    }

    const safeConstraints = normalizeConstraintPayload(constraints);

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
      generations: response.data.generations,
      report: response.data.report || null,
      constraints: safeConstraints,
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

exports.validateSchedule = async (req, res) => {
  try {
    const { schedule } = req.body || {};

    if (!Array.isArray(schedule)) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: 'schedule must be an array',
      });
    }

    const conflicts = [];
    const facultySlots = new Map();
    const roomSlots = new Map();

    for (let i = 0; i < schedule.length; i += 1) {
      const item = schedule[i] || {};
      const day = String(item.day || item.day_of_week || '').trim();
      const time = String(item.time || item.time_slot || '').trim();
      const facultyId = item.faculty_id ?? item.facultyId ?? item.faculty ?? null;
      const roomId = item.room_id ?? item.roomId ?? item.room ?? null;
      const subject = item.subject || item.title || `Item ${i + 1}`;

      if (!day || !time) {
        conflicts.push({
          type: 'invalid_timeslot',
          message: 'Missing day/time in schedule item',
          itemIndex: i,
          subject,
        });
        continue;
      }

      if (facultyId != null && facultyId !== '') {
        const facultyKey = `${String(facultyId)}|${day}|${time}`;
        const existing = facultySlots.get(facultyKey);
        if (existing) {
          conflicts.push({
            type: 'faculty_conflict',
            day,
            time,
            faculty: facultyId,
            subjects: [existing.subject, subject],
            itemIndexes: [existing.index, i],
          });
        } else {
          facultySlots.set(facultyKey, { index: i, subject });
        }
      }

      if (roomId != null && roomId !== '') {
        const roomKey = `${String(roomId)}|${day}|${time}`;
        const existing = roomSlots.get(roomKey);
        if (existing) {
          conflicts.push({
            type: 'room_conflict',
            day,
            time,
            room: roomId,
            subjects: [existing.subject, subject],
            itemIndexes: [existing.index, i],
          });
        } else {
          roomSlots.set(roomKey, { index: i, subject });
        }
      }
    }

    res.json({
      valid: conflicts.length === 0,
      conflictCount: conflicts.length,
      conflicts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate schedule', details: error.message });
  }
};
