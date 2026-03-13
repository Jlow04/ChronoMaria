const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = require('./config/database');

const DATA_FILE = path.resolve(__dirname, '../data');

function parseCsvLine(line) {
  // Input file has no quoted commas, so simple split is reliable here.
  return line.split(',').map((part) => part.trim());
}

function getAcademicYear(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function to12HourTime(rawTime) {
  const text = String(rawTime || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${suffix}`;
}

function normalizeTimeRange(rawRange) {
  const text = String(rawRange || '').trim();
  if (!text) return '';

  const [start, end] = text.split('-').map((part) => part.trim());
  if (!start || !end) return text;
  return `${to12HourTime(start)} - ${to12HourTime(end)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(error) {
  if (!error || !error.message) return false;
  const msg = String(error.message).toLowerCase();
  return msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('gateway');
}

async function runWithRetry(operation, label, maxAttempts = 5) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await operation();
    if (!result.error) return result;

    lastError = result.error;
    if (!isTransientError(result.error) || attempt === maxAttempts) {
      break;
    }

    const delayMs = 500 * attempt;
    console.warn(`Transient error on ${label} (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`);
    await sleep(delayMs);
  }

  return { data: null, error: lastError, count: null };
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferDepartment(code, section, title) {
  const normalizedCode = String(code || '').toUpperCase();
  const normalizedTitle = String(title || '').toLowerCase();

  if (normalizedCode.startsWith('ARCE') || normalizedCode.startsWith('CE')) return 'Engineering';
  if (normalizedCode.startsWith('ARCHMATH') || normalizedCode.startsWith('GMATH')) return 'Mathematics';
  if (normalizedCode.startsWith('PATHFIT') || normalizedTitle.includes('physical')) return 'Physical Education';
  if (normalizedCode.startsWith('CFE') || normalizedTitle.includes('christian')) return 'Theology';
  if (normalizedCode.startsWith('G')) return 'General Education';
  if (normalizedCode.startsWith('AR')) return 'Architecture';

  return 'Architecture';
}

function normalizeDepartment(value) {
  const text = String(value || '').trim().toLowerCase();
  const aliases = {
    'general education': 'general education',
    'gen ed': 'general education',
    'physical education': 'general education',
    'pe': 'general education',
    'theology': 'general education',
    'architecture': 'architecture',
    'engineering': 'engineering',
    'mathematics': 'mathematics',
    'math': 'mathematics',
    'computer science': 'computer science',
    'information technology': 'information technology',
  };
  return aliases[text] || text;
}

function inferRoomMeta(roomNumber) {
  const room = String(roomNumber || '').toUpperCase();

  if (room === 'GYM') {
    return {
      building: 'Sports Complex',
      capacity: 120,
      type: 'Gymnasium',
    };
  }

  if (room.startsWith('D')) {
    return {
      building: 'Architecture Building',
      capacity: 30,
      type: 'Design Studio',
    };
  }

  if (room.startsWith('AP')) {
    return {
      building: 'Arts and Physical Education Building',
      capacity: 35,
      type: 'Classroom',
    };
  }

  if (room.startsWith('E')) {
    return {
      building: 'Engineering Building',
      capacity: 40,
      type: 'Classroom',
    };
  }

  if (room.startsWith('S2')) {
    return {
      building: 'Science Building',
      capacity: 40,
      type: 'Computer Lab',
    };
  }

  if (room.startsWith('S1') || room.startsWith('S')) {
    return {
      building: 'Science Building',
      capacity: 45,
      type: 'Classroom',
    };
  }

  return {
    building: 'Main Campus',
    capacity: 35,
    type: 'Classroom',
  };
}

function parseDataFile(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const courseHeader = 'section,course_code,course_title,units,schedule_mwf,schedule_tth,room';
  const profHeader = 'prof_id,first_name,last_name,middle_initial,department,email';

  const courses = [];
  const professors = [];

  let mode = 'none';
  for (const line of lines) {
    if (line.toLowerCase() === courseHeader) {
      mode = 'courses';
      continue;
    }
    if (line.toLowerCase() === profHeader) {
      mode = 'professors';
      continue;
    }

    if (mode === 'courses') {
      const [section, course_code, course_title, units, schedule_mwf, schedule_tth, room] = parseCsvLine(line);
      if (!section || !course_code || !course_title || !room) continue;

      courses.push({
        section,
        course_code,
        course_title,
        units: Number(units) || 3,
        schedule_mwf,
        schedule_tth,
        room,
      });
      continue;
    }

    if (mode === 'professors') {
      const [prof_id, first_name, last_name, middle_initial, department, email] = parseCsvLine(line);
      if (!first_name || !last_name || !email) continue;

      const middle = middle_initial ? ` ${middle_initial}.` : '';
      professors.push({
        prof_id: Number(prof_id) || null,
        name: `${toTitleCase(first_name)}${middle} ${toTitleCase(last_name)}`.trim(),
        department: toTitleCase(department) || 'General Education',
        email: email.toLowerCase(),
      });
    }
  }

  return { courses, professors };
}

function getSubjectCourseNoValue(subject) {
  return subject?.course_no || subject?.['Course_No.'] || subject?.courseNo || subject?.code || null;
}

function getSubjectCodeValue(subject) {
  return subject?.code || subject?.CODE || subject?.course_code || null;
}

function getSubjectSectionValue(subject) {
  return subject?.section || subject?.SECTION || null;
}

function detectSubjectSchema(sampleRows = []) {
  const first = sampleRows[0] || {};
  const keys = new Set(Object.keys(first));

  const courseNoField = keys.has('course_no')
    ? 'course_no'
    : (keys.has('Course_No.') ? 'Course_No.' : 'code');

  const codeField = keys.has('code')
    ? 'code'
    : (keys.has('CODE') ? 'CODE' : null);

  const sectionField = keys.has('section')
    ? 'section'
    : (keys.has('SECTION') ? 'SECTION' : null);

  return { courseNoField, codeField, sectionField };
}

function buildSubjects(courses, subjectSchema) {
  const byCourseNo = new Map();

  for (const item of courses) {
    if (!byCourseNo.has(item.course_code)) {
      const department = inferDepartment(item.course_code, item.section, item.course_title);
      const index = byCourseNo.size;
      const record = {
        [subjectSchema.courseNoField]: item.course_code,
        name: item.course_title,
        units: item.units,
        hours_per_week: item.units,
        department,
      };

      if (subjectSchema.codeField) {
        record[subjectSchema.codeField] = String(4000 + index);
      }

      if (subjectSchema.sectionField) {
        record[subjectSchema.sectionField] = item.section;
      }

      byCourseNo.set(item.course_code, {
        ...record,
      });
    }
  }

  return Array.from(byCourseNo.values());
}

function buildRooms(courses) {
  const byRoom = new Map();

  for (const item of courses) {
    const roomNumber = item.room;
    if (!byRoom.has(roomNumber)) {
      const roomMeta = inferRoomMeta(roomNumber);
      byRoom.set(roomNumber, {
        room_number: roomNumber,
        building: roomMeta.building,
        capacity: roomMeta.capacity,
        type: roomMeta.type,
      });
    }
  }

  return Array.from(byRoom.values());
}

function buildFaculty(professors, subjects) {
  const subjectByDepartment = new Map();
  for (const subject of subjects) {
    if (!subjectByDepartment.has(subject.department)) {
      subjectByDepartment.set(subject.department, []);
    }
    subjectByDepartment.get(subject.department).push(getSubjectCourseNoValue(subject));
  }

  const departmentCounts = new Map();

  const buildRotatedPreferences = (codes, offset, maxItems = 5) => {
    if (!codes || codes.length === 0) return [];
    const unique = [...new Set(codes)];
    const size = Math.min(maxItems, unique.length);
    const start = offset % unique.length;
    const result = [];
    for (let i = 0; i < size; i += 1) {
      result.push(unique[(start + i) % unique.length]);
    }
    return result;
  };

  return professors.map((prof) => {
    const dept = prof.department;
    const idx = departmentCounts.get(dept) || 0;
    departmentCounts.set(dept, idx + 1);

    const departmentCodes = subjectByDepartment.get(dept) || [];
    const preferred = buildRotatedPreferences(departmentCodes, idx, 5);

    return {
      name: prof.name,
      email: prof.email,
      department: prof.department,
      max_units: prof.department === 'Architecture' || prof.department === 'Engineering' ? 24 : 18,
      preferred_subjects: preferred.slice(0, 5).join(', ') || null,
    };
  });
}

async function upsertByKey(table, key, records) {
  const { data: existingRows, error: readError } = await runWithRetry(
    () => supabase.from(table).select('*'),
    `${table}.select`
  );
  if (readError) throw new Error(`Failed to read ${table}: ${readError.message}`);

  const existingMap = new Map(existingRows.map((row) => [String(row[key]).toLowerCase(), row]));

  let inserted = 0;
  let updated = 0;

  for (const record of records) {
    const value = String(record[key]).toLowerCase();
    const existing = existingMap.get(value);

    if (existing) {
      const payload = { ...record };
      const { error } = await runWithRetry(
        () => supabase.from(table).update(payload).eq('id', existing.id),
        `${table}.update(${record[key]})`
      );
      if (error) throw new Error(`Failed to update ${table} (${record[key]}): ${error.message}`);
      updated += 1;
      continue;
    }

    const { error } = await runWithRetry(
      () => supabase.from(table).insert([record]),
      `${table}.insert(${record[key]})`
    );
    if (error) throw new Error(`Failed to insert ${table} (${record[key]}): ${error.message}`);
    inserted += 1;
  }

  return { inserted, updated, total: records.length };
}

async function rebalanceFacultyPreferences() {
  const [facultyResult, subjectsResult] = await Promise.all([
    runWithRetry(() => supabase.from('faculty').select('*'), 'faculty.select.backfillPrefs'),
    runWithRetry(() => supabase.from('subjects').select('*'), 'subjects.select.backfillPrefs'),
  ]);

  if (facultyResult.error) throw new Error(`Failed to read faculty for preference backfill: ${facultyResult.error.message}`);
  if (subjectsResult.error) throw new Error(`Failed to read subjects for preference backfill: ${subjectsResult.error.message}`);

  const subjectsByDept = new Map();
  for (const subject of subjectsResult.data || []) {
    const dept = subject.department;
    if (!subjectsByDept.has(dept)) subjectsByDept.set(dept, []);
    subjectsByDept.get(dept).push(getSubjectCourseNoValue(subject));
  }

  const facultyByDept = new Map();
  for (const member of facultyResult.data || []) {
    const dept = member.department || 'General Education';
    if (!facultyByDept.has(dept)) facultyByDept.set(dept, []);
    facultyByDept.get(dept).push(member);
  }

  let updated = 0;
  for (const [dept, members] of facultyByDept.entries()) {
    const codes = [...new Set(subjectsByDept.get(dept) || [])];
    if (codes.length === 0) continue;

    for (let i = 0; i < members.length; i += 1) {
      const member = members[i];

      const selected = [];
      const maxItems = Math.min(5, codes.length);
      for (let j = 0; j < maxItems; j += 1) {
        selected.push(codes[(i + j) % codes.length]);
      }

      const prefValue = selected.join(', ');
      const updateResult = await runWithRetry(
        () => supabase.from('faculty').update({ preferred_subjects: prefValue }).eq('id', member.id),
        `faculty.rebalancePreference(${member.id})`
      );
      if (updateResult.error) {
        throw new Error(`Failed to rebalance preference for faculty id ${member.id}: ${updateResult.error.message}`);
      }
      updated += 1;
    }
  }

  return { updated };
}

async function upsertMasterSchedule(courses) {
  const semester = 'Second Semester';
  const academicYear = getAcademicYear();
  const scheduleName = `Master List Import (${academicYear})`;

  const existingSchedule = await runWithRetry(
    () => supabase
      .from('schedules')
      .select('*')
      .eq('name', scheduleName)
      .eq('semester', semester)
      .eq('academic_year', academicYear)
      .maybeSingle(),
    'schedules.findMaster'
  );

  if (existingSchedule.error) {
    throw new Error(`Failed to read schedules: ${existingSchedule.error.message}`);
  }

  let scheduleRow = existingSchedule.data;
  if (!scheduleRow) {
    const inserted = await runWithRetry(
      () => supabase
        .from('schedules')
        .insert([{ name: scheduleName, semester, academic_year: academicYear }])
        .select()
        .single(),
      'schedules.insertMaster'
    );

    if (inserted.error) {
      throw new Error(`Failed to create schedule master row: ${inserted.error.message}`);
    }
    scheduleRow = inserted.data;
  }

  const facultyRows = await runWithRetry(() => supabase.from('faculty').select('*'), 'faculty.selectForSchedule');
  const subjectRows = await runWithRetry(() => supabase.from('subjects').select('*'), 'subjects.selectForSchedule');
  const roomRows = await runWithRetry(() => supabase.from('rooms').select('*'), 'rooms.selectForSchedule');

  if (facultyRows.error) throw new Error(`Failed to read faculty for schedule import: ${facultyRows.error.message}`);
  if (subjectRows.error) throw new Error(`Failed to read subjects for schedule import: ${subjectRows.error.message}`);
  if (roomRows.error) throw new Error(`Failed to read rooms for schedule import: ${roomRows.error.message}`);

  const subjectsByCourseNo = new Map((subjectRows.data || []).map((row) => [String(getSubjectCourseNoValue(row)).toUpperCase(), row]));
  const roomsByNumber = new Map((roomRows.data || []).map((row) => [String(row.room_number).toUpperCase(), row]));

  const facultyByDepartment = new Map();
  for (const member of facultyRows.data || []) {
    const dept = normalizeDepartment(member.department || 'General Education');
    if (!facultyByDepartment.has(dept)) facultyByDepartment.set(dept, []);
    facultyByDepartment.get(dept).push(member);
  }

  const educationCluster = [
    ...(facultyByDepartment.get('general education') || []),
    ...(facultyByDepartment.get('mathematics') || []),
  ];

  const facultyIndexByDept = new Map();
  const normalizeToken = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const parsePreferred = (value) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean);
  const matchesPreference = (facultyMember, subjectData, courseData) => {
    const prefs = parsePreferred(facultyMember?.preferred_subjects).map(normalizeToken);
    if (prefs.length === 0) return false;

    const candidates = [
      normalizeToken(getSubjectCourseNoValue(subjectData)),
      normalizeToken(getSubjectCodeValue(subjectData)),
      normalizeToken(subjectData?.name),
      normalizeToken(courseData?.course_code),
      normalizeToken(courseData?.course_title),
    ].filter(Boolean);

    for (const pref of prefs) {
      if (candidates.some((candidate) => candidate === pref || candidate.includes(pref) || pref.includes(candidate))) {
        return true;
      }
    }
    return false;
  };

  const pickFaculty = (department, subjectData, courseData) => {
    const normalizedDept = normalizeDepartment(department);
    const deptPool = facultyByDepartment.get(normalizedDept) || [];
    let pool = deptPool;

    if (pool.length === 0 && (normalizedDept === 'general education' || normalizedDept === 'mathematics')) {
      pool = educationCluster;
    }

    // Strict behavior: do not assign wrong-profession faculty when no proper pool is available.
    if (pool.length === 0) return null;

    const preferredPool = pool.filter((member) => matchesPreference(member, subjectData, courseData));
    const activePool = preferredPool.length > 0 ? preferredPool : pool;

    const idx = facultyIndexByDept.get(normalizedDept) || 0;
    const selected = activePool[idx % activePool.length];
    facultyIndexByDept.set(normalizedDept, idx + 1);
    return selected;
  };

  const deleteOldItems = await runWithRetry(
    () => supabase.from('schedule_items').delete().eq('schedule_id', scheduleRow.id),
    'schedule_items.deleteOld'
  );
  if (deleteOldItems.error) {
    throw new Error(`Failed to clear existing schedule_items: ${deleteOldItems.error.message}`);
  }

  const items = [];
  for (const course of courses) {
    const subject = subjectsByCourseNo.get(String(course.course_code).toUpperCase());
    const room = roomsByNumber.get(String(course.room).toUpperCase());
    const department = subject?.department || inferDepartment(course.course_code, course.section, course.course_title);
    const faculty = pickFaculty(department, subject, course);

    if (course.schedule_mwf) {
      items.push({
        schedule_id: scheduleRow.id,
        subject_id: subject?.id || null,
        faculty_id: faculty?.id || null,
        room_id: room?.id || null,
        day_of_week: 'MWF',
        time_slot: normalizeTimeRange(course.schedule_mwf),
      });
    }

    if (course.schedule_tth) {
      items.push({
        schedule_id: scheduleRow.id,
        subject_id: subject?.id || null,
        faculty_id: faculty?.id || null,
        room_id: room?.id || null,
        day_of_week: 'TTHS',
        time_slot: normalizeTimeRange(course.schedule_tth),
      });
    }
  }

  let insertedCount = 0;
  for (const item of items) {
    const inserted = await runWithRetry(
      () => supabase.from('schedule_items').insert([item]),
      `schedule_items.insert(${item.day_of_week} ${item.time_slot})`
    );

    if (inserted.error) {
      throw new Error(`Failed to insert schedule item (${item.day_of_week} ${item.time_slot}): ${inserted.error.message}`);
    }
    insertedCount += 1;
  }

  return {
    scheduleName,
    semester,
    academicYear,
    scheduleId: scheduleRow.id,
    scheduleItemsInserted: insertedCount,
  };
}

async function main() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`Data file not found: ${DATA_FILE}`);
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const { courses, professors } = parseDataFile(raw);

    if (courses.length === 0) {
      throw new Error('No course rows found in data file.');
    }
    if (professors.length === 0) {
      throw new Error('No professor rows found in data file.');
    }

    const schemaProbe = await runWithRetry(
      () => supabase.from('subjects').select('*').limit(1),
      'subjects.probeSchema'
    );

    if (schemaProbe.error) {
      throw new Error(`Failed to inspect subjects schema: ${schemaProbe.error.message}`);
    }

    const subjectSchema = detectSubjectSchema(schemaProbe.data || []);
    const subjects = buildSubjects(courses, subjectSchema);
    const rooms = buildRooms(courses);
    const faculty = buildFaculty(professors, subjects);

    const facultyResult = await upsertByKey('faculty', 'email', faculty);
    const subjectsResult = await upsertByKey('subjects', subjectSchema.courseNoField, subjects);
    const roomsResult = await upsertByKey('rooms', 'room_number', rooms);
    const preferenceRebalance = await rebalanceFacultyPreferences();
    const scheduleResult = await upsertMasterSchedule(courses);

    console.log('\nImport completed successfully.');
    console.log('--------------------------------');
    console.log(`Faculty   : ${facultyResult.total} processed (${facultyResult.inserted} inserted, ${facultyResult.updated} updated)`);
    console.log(`Subjects  : ${subjectsResult.total} processed (${subjectsResult.inserted} inserted, ${subjectsResult.updated} updated)`);
    console.log(`Rooms     : ${roomsResult.total} processed (${roomsResult.inserted} inserted, ${roomsResult.updated} updated)`);
    console.log(`Preferences: ${preferenceRebalance.updated} faculty rows rebalanced`);
    console.log(`Schedule  : ${scheduleResult.scheduleName} | ${scheduleResult.semester} AY ${scheduleResult.academicYear}`);
    console.log(`Items     : ${scheduleResult.scheduleItemsInserted} standardized schedule entries inserted`);
  } catch (error) {
    console.error('\nImport failed:', error.message);
    process.exit(1);
  }
}

main();
