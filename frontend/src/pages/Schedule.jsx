import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { scheduleService, facultyService, subjectService, roomService } from '../services/api';
import './Schedule.css';

const formatDateTimeStandard = (date) => new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
}).format(date);

const formatClockTime = (value) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
};

const formatTimeRange = (range) => {
  const [start, end] = String(range || '').split('-').map((part) => part.trim());
  if (!start || !end) return String(range || '').trim();
  return `${formatClockTime(start)} - ${formatClockTime(end)}`;
};

const inferSectionLabel = (courseCode = '', department = '') => {
  const code = String(courseCode || '').toUpperCase();
  const dept = String(department || '').toUpperCase();

  if (code.startsWith('AR32') || code.startsWith('AR33')) return 'BSAR 3A';
  if (code.startsWith('ARCE') || code.startsWith('CE') || code.startsWith('GE') || code.startsWith('GST') || code.startsWith('GWO') || code.startsWith('GAR') || code.startsWith('CFE104') || code.startsWith('PATHFIT4')) return 'BSAR 2A';
  if (code.startsWith('AR12') || code.startsWith('ARCHMATH') || code.startsWith('GPIC') || code.startsWith('GSELF') || code.startsWith('PEECO') || code.startsWith('CFE102') || code.startsWith('PATHFIT2')) return 'BSAR 1A';
  if (dept.includes('COMPUTER SCIENCE')) return 'BSCS 1A';
  if (dept.includes('INFORMATION TECHNOLOGY')) return 'BSIT 1A';

  return 'CLASS 1';
};

const getSubjectCourseNo = (subject) => subject?.course_no || subject?.['Course_No.'] || subject?.code || subject?.CODE || null;
const getSubjectCode = (subject) => subject?.code || subject?.CODE || null;
const getSubjectSection = (subject) => subject?.section || subject?.SECTION || null;

const formatScheduleByTrack = (day, time) => {
  const normalizedDay = (day || '').toLowerCase();
  const dayShortMap = {
    monday: 'M',
    tuesday: 'T',
    wednesday: 'W',
    thursday: 'TH',
    friday: 'F',
    saturday: 'S',
  };
  const dayShort = dayShortMap[normalizedDay] || (day || '').toUpperCase();
  const value = `${dayShort} (${formatTimeRange(time)})`.trim();

  if (normalizedDay.includes('tuesday') || normalizedDay.includes('thursday')) {
    return { mwf: '-', tths: value };
  }

  return { mwf: value, tths: '-' };
};

function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [constraints, setConstraints] = useState({
    max_generations: 300,
    population_size: 60,
    mutation_rate: 0.1,
    max_runtime_seconds: 20
  });

  useEffect(() => {
    checkData();
  }, []);

  const checkData = async () => {
    try {
      const [faculty, subjects, rooms] = await Promise.all([
        facultyService.getAll(),
        subjectService.getAll(),
        roomService.getAll()
      ]);
      
      if (faculty.length > 0 && subjects.length > 0 && rooms.length > 0) {
        setDataReady(true);
      }
    } catch (error) {
      console.error('Error checking data:', error);
    }
  };

  const loadMasterSchedule = async () => {
    setLoadingMaster(true);
    try {
      const result = await scheduleService.getMaster();
      if (!result?.items || result.items.length === 0) {
        alert('No master schedule found in database yet.');
        return;
      }

      const grouped = new Map();
      for (const item of result.items) {
        const key = `${item.subject?.id || 'none'}_${item.faculty?.id || 'none'}_${item.room?.id || 'none'}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            section: item.section || getSubjectSection(item.subject) || inferSectionLabel(getSubjectCourseNo(item.subject), item.subject?.department),
            courseNo: getSubjectCourseNo(item.subject) || '-',
            courseCode: getSubjectCode(item.subject) || '-',
            title: item.subject?.name || 'Untitled Subject',
            units: item.subject?.units || 3,
            mwfSchedule: '-',
            tthsSchedule: '-',
            room: item.room?.room_number || 'TBA',
            roomType: item.room?.type || 'Room',
            faculty: item.faculty?.name || 'TBA',
            department: item.faculty?.department || item.subject?.department || '-',
          });
        }

        const row = grouped.get(key);
        if ((!row.courseCode || row.courseCode === '-') && getSubjectCode(item.subject)) {
          row.courseCode = getSubjectCode(item.subject);
        }
        if ((item.day_of_week || '').toUpperCase() === 'MWF') {
          row.mwfSchedule = item.time_slot || '-';
        } else if ((item.day_of_week || '').toUpperCase() === 'TTHS') {
          row.tthsSchedule = item.time_slot || '-';
        }
      }

      setSchedule(Array.from(grouped.values()));
      setGeneratedAt(result.schedule?.created_at ? formatDateTimeStandard(new Date(result.schedule.created_at)) : formatDateTimeStandard(new Date()));
    } catch (error) {
      console.error('Error loading master schedule:', error);
      alert(`Failed to load master schedule: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoadingMaster(false);
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [faculty, subjects, rooms] = await Promise.all([
        facultyService.getAll(),
        subjectService.getAll(),
        roomService.getAll()
      ]);

      // Check if we have data
      if (faculty.length === 0 || subjects.length === 0 || rooms.length === 0) {
        alert('Please add faculty, subjects, and rooms before generating a schedule.');
        setLoading(false);
        return;
      }

      const result = await scheduleService.generate({
        faculty,
        subjects,
        rooms,
        constraints
      });

      const subjectByName = new Map(subjects.map((subject) => [subject.name, subject]));
      const facultyByName = new Map(faculty.map((member) => [member.name, member]));
      const roomByNumber = new Map(rooms.map((room) => [room.room_number, room]));

      const enrichedSchedule = (result.schedule || []).map((item, index) => {
        const subject = subjectByName.get(item.subject) || {};
        const facultyMember = facultyByName.get(item.faculty) || {};
        const room = roomByNumber.get(item.room) || {};
        const groupedSchedule = formatScheduleByTrack(item.day, item.time);

        return {
          id: index + 1,
          section: getSubjectSection(subject) || inferSectionLabel(getSubjectCourseNo(subject), subject.department),
          courseNo: getSubjectCourseNo(subject) || `SUBJ-${item.subject_id || index + 1}`,
          courseCode: getSubjectCode(subject) || '-',
          title: item.subject,
          units: subject.units || 3,
          mwfSchedule: groupedSchedule.mwf,
          tthsSchedule: groupedSchedule.tths,
          room: item.room,
          roomType: room.type || 'Room',
          faculty: item.faculty,
          department: facultyMember.department || subject.department || '-'
        };
      });

      setSchedule(enrichedSchedule);
      setGeneratedAt(formatDateTimeStandard(new Date()));
      alert(`Schedule generated successfully!\nFitness: ${result.fitness}\nGenerations: ${result.generations}`);
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert(`Failed to generate schedule: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Schedule Generation</h1>
          <p>Generate optimized faculty loading schedules using genetic algorithm</p>
        </div>

        <div className="card">
          <h2>Genetic Algorithm Parameters</h2>
          {!dataReady && (
            <div style={{ background: '#fff3cd', padding: '10px', marginBottom: '15px', borderRadius: '4px', color: '#856404' }}>
              ⚠️ Please add faculty, subjects, and rooms before generating a schedule.
            </div>
          )}
          {dataReady && (
            <div style={{ background: '#d4edda', padding: '10px', marginBottom: '15px', borderRadius: '4px', color: '#155724' }}>
              ✅ Data ready! You can now generate schedules.
            </div>
          )}
          <div className="form-group">
            <label>Max Generations</label>
            <input
              type="number"
              value={constraints.max_generations}
              onChange={(e) => setConstraints({ ...constraints, max_generations: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Population Size</label>
            <input
              type="number"
              value={constraints.population_size}
              onChange={(e) => setConstraints({ ...constraints, population_size: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Mutation Rate</label>
            <input
              type="number"
              step="0.01"
              value={constraints.mutation_rate}
              onChange={(e) => setConstraints({ ...constraints, mutation_rate: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Max Runtime (seconds)</label>
            <input
              type="number"
              min="5"
              max="120"
              value={constraints.max_runtime_seconds}
              onChange={(e) => setConstraints({ ...constraints, max_runtime_seconds: parseInt(e.target.value, 10) })}
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={generateSchedule}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
          <button className="btn btn-secondary print-btn" onClick={loadMasterSchedule} disabled={loadingMaster}>
            {loadingMaster ? 'Loading...' : 'Load Master from DB'}
          </button>
          {schedule && schedule.length > 0 && (
            <button className="btn btn-secondary print-btn" onClick={() => window.print()}>
              Print Master List
            </button>
          )}
        </div>

        {schedule && (
          <div className="card master-list-sheet">
            <div className="master-header">
              <p className="university-name">SAINT MARY'S UNIVERSITY</p>
              <p className="office-name">OFFICE OF THE UNIVERSITY REGISTRAR</p>
              <h2>MASTER LIST</h2>
              <p className="meta">Date and Time Printed: {generatedAt || formatDateTimeStandard(new Date())}</p>
            </div>

            <div className="master-table-wrap">
              <table className="master-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Course Code</th>
                    <th>Course No.</th>
                    <th>Descriptive Title</th>
                    <th>Units</th>
                    <th>Schedule under MWF</th>
                    <th>Schedule under TTHS</th>
                    <th>Room</th>
                    <th>Faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.id}>
                      <td>{item.section}</td>
                      <td>{item.courseCode}</td>
                      <td>{item.courseNo}</td>
                      <td>{item.title}</td>
                      <td>{item.units}</td>
                      <td>{item.mwfSchedule}</td>
                      <td>{item.tthsSchedule}</td>
                      <td>{item.room}</td>
                      <td>{item.faculty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="master-legend">
              <span>Code Legend: 1=Block; 2=Reserved; None=Common; S=Special</span>
              <span>* Laboratory Rooms</span>
            </div>
          </div>
        )}

        {!schedule && (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>
              No schedule generated yet. Configure parameters and click "Generate Schedule" to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
