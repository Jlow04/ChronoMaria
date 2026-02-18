const axios = require('axios');

exports.generateSchedule = async (req, res) => {
  try {
    const { faculty, subjects, rooms, constraints } = req.body;

    // Call Python genetic algorithm service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${pythonServiceUrl}/generate`, {
      faculty,
      subjects,
      rooms,
      constraints
    });

    res.json({
      success: true,
      schedule: response.data.schedule,
      fitness: response.data.fitness,
      generations: response.data.generations
    });
  } catch (error) {
    console.error('Error generating schedule:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error.message 
    });
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
