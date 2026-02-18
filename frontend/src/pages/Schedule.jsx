import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { scheduleService, facultyService, subjectService, roomService } from '../services/api';
import './Schedule.css';

function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [constraints, setConstraints] = useState({
    max_generations: 1000,
    population_size: 100,
    mutation_rate: 0.1
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
      
      setSchedule(result.schedule);
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
          <button 
            className="btn btn-success" 
            onClick={generateSchedule}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>

        {schedule && (
          <div className="card">
            <h2>Generated Schedule</h2>
            <div className="schedule-grid">
              {schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <h3>{item.subject}</h3>
                  <p><strong>Faculty:</strong> {item.faculty}</p>
                  <p><strong>Room:</strong> {item.room}</p>
                  <p><strong>Time:</strong> {item.time}</p>
                  <p><strong>Day:</strong> {item.day}</p>
                </div>
              ))}
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
