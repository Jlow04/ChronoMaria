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

const QUALITY_COLOR = { Excellent: '#22c55e', Good: '#22c55e', Fair: '#facc15', Poor: '#f97316', 'Very Poor': '#ef4444' };
const QUALITY_ICON  = { Excellent: '🟢', Good: '🟢', Fair: '🟡', Poor: '🔴', 'Very Poor': '🔴' };

const fitnessToQuality = (score) => {
  if (score >= 95) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
};

function QualityPanel({ report, fitness, generations, subjectCount, schedule }) {
  if (!report && fitness == null) return null;

  const s = report?.summary || {};
  const c = report?.conflicts || {};
  const fb = report?.fitness_breakdown || {};
  const wl = report?.faculty_workload || [];

  const quality = s.quality || fitnessToQuality(fitness ?? 0);
  const color = QUALITY_COLOR[quality] || '#6b7280';
  const icon = QUALITY_ICON[quality] || '⚪';
  const score = s.fitness_score ?? fitness ?? 0;
  const scheduleFacultyCount = new Set(
    (schedule || []).map((item) => String(item?.faculty || '').trim()).filter(Boolean)
  ).size;
  const usedFaculty =
    (typeof s.total_faculty_used === 'number' && s.total_faculty_used > 0)
      ? s.total_faculty_used
      : (wl.length > 0 ? wl.length : scheduleFacultyCount);
  const totalSubjects = s.total_subjects ?? subjectCount ?? 0;
  const gens = s.generations_run ?? generations ?? 0;
  const hasBreakdownData = [
    fb.base_score,
    fb.penalty_faculty_conflicts,
    fb.penalty_room_conflicts,
    fb.penalty_dept_mismatches,
    fb.penalty_unqualified,
    fb.penalty_non_preferred,
    fb.penalty_overload,
    fb.total_penalty,
  ].some((value) => typeof value === 'number');
  const baseScoreFallback = 100 + (Number(totalSubjects) * 20);
  const baseScore = typeof fb.base_score === 'number' ? fb.base_score : baseScoreFallback;

  return (
    <div className="quality-summary-card" style={{ '--quality-color': color }}>
      <div className="quality-summary-bar" />
      <div className="quality-summary-header">
        <div className="quality-left">
          <span className="quality-state-icon">{icon}</span>
          <div className="quality-text">
            <p className="quality-label">Quality of Generated List</p>
            <h3>{quality}</h3>
          </div>
        </div>
        <div className="quality-metrics">
          <span>Score: <strong>{score}/100</strong></span>
          <span>Subjects: <strong>{totalSubjects}</strong></span>
          <span>Faculty: <strong>{usedFaculty}</strong></span>
          <span>Generations: <strong>{gens}</strong></span>
        </div>
      </div>

      <details className="quality-dropdown">
        <summary>Show Full Report</summary>
        <div className="quality-dropdown-content">
          <div className="quality-grid">
            <div className="quality-section">
              <h4>Conflicts</h4>
              <p>Faculty conflicts: <strong>{c.faculty_conflict_count ?? 0}</strong></p>
              <p>Room conflicts: <strong>{c.room_conflict_count ?? 0}</strong></p>
              <p>Department mismatches: <strong>{c.dept_mismatch_count ?? 0}</strong></p>
              <p>Unqualified assignments: <strong>{c.unqualified_count ?? 0}</strong></p>
              <p>Non-preferred assignments: <strong>{c.non_preferred_count ?? 0}</strong></p>
              <p>Overloaded faculty: <strong>{c.overload_count ?? 0}</strong></p>
              <p>Workload imbalanced: <strong>{c.workload_imbalanced ? 'Yes' : 'No'}</strong></p>
            </div>

            <div className="quality-section">
              <h4>Fitness Breakdown</h4>
              {!hasBreakdownData && (
                <p className="quality-note">No breakdown data from backend.</p>
              )}
              <p>Base score: <strong>{baseScore}</strong></p>
              <p>Faculty conflict penalty: <strong>-{fb.penalty_faculty_conflicts ?? 0}</strong></p>
              <p>Room conflict penalty: <strong>-{fb.penalty_room_conflicts ?? 0}</strong></p>
              <p>Dept mismatch penalty: <strong>-{fb.penalty_dept_mismatches ?? 0}</strong></p>
              <p>Unqualified penalty: <strong>-{fb.penalty_unqualified ?? 0}</strong></p>
              <p>Non-preferred penalty: <strong>-{fb.penalty_non_preferred ?? 0}</strong></p>
              <p>Overload penalty: <strong>-{fb.penalty_overload ?? 0}</strong></p>
              <p>Total penalty: <strong>-{fb.total_penalty ?? 0}</strong></p>
            </div>
          </div>

          {wl.length > 0 && (
            <div className="quality-section quality-workload">
              <h4>Faculty Workload</h4>
              {wl.map((entry, index) => (
                <p key={index}>
                  {entry.faculty}: <strong>{entry.total_units}/{entry.max_units} units</strong>
                  {entry.status === 'OVERLOADED' ? ' (Overloaded)' : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [report,   setReport]   = useState(null);
  const [fitness,  setFitness]  = useState(null);
  const [generations, setGenerations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
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
      setFitness(result.fitness ?? null);
      setGenerations(result.generations ?? null);
      setReport(result.report || null);
      setGeneratedAt(formatDateTimeStandard(new Date()));
      alert(`Schedule generated successfully!\nFitness: ${result.fitness}\nQuality: ${result.report?.summary?.quality || 'N/A'}\nGenerations: ${result.generations}`);
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
          {schedule && schedule.length > 0 && (
            <button className="btn btn-secondary print-btn" onClick={() => window.print()}>
              Print Generated List
            </button>
          )}
        </div>

        {schedule && (
          <>
            <QualityPanel
              report={report}
              fitness={fitness}
              generations={generations}
              subjectCount={schedule?.length || 0}
              schedule={schedule}
            />

            <div className="card master-list-sheet">
              <div className="master-header">
                <p className="university-name">SAINT MARY'S UNIVERSITY</p>
                <h2>GENERATED LIST</h2>
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
            </div>
          </>
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
