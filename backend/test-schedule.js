const axios = require('axios');

async function testScheduleGeneration() {
  console.log('🧪 Testing schedule generation...\n');
  
  try {
    // Fetch data from backend
    console.log('Fetching data from backend...');
    const facultyRes = await axios.get('http://localhost:5000/api/faculty');
    const subjectsRes = await axios.get('http://localhost:5000/api/subjects');
    const roomsRes = await axios.get('http://localhost:5000/api/rooms');
    
    const faculty = facultyRes.data;
    const subjects = subjectsRes.data;
    const rooms = roomsRes.data;
    
    console.log(`✅ Fetched ${faculty.length} faculty, ${subjects.length} subjects, ${rooms.length} rooms\n`);
    
    // Generate schedule
    console.log('Generating schedule with GA...');
    const payload = {
      faculty,
      subjects,
      rooms,
      constraints: {
        max_generations: 100,
        population_size: 50,
        mutation_rate: 0.1
      }
    };
    
    const scheduleRes = await axios.post('http://localhost:5000/api/schedule/generate', payload);
    
    console.log('\n✅ Schedule generated successfully!');
    console.log('Fitness score:', scheduleRes.data.fitness);
    console.log('Generations:', scheduleRes.data.generations);
    console.log('Schedule items:', scheduleRes.data.schedule?.length || 0);
    
    if (scheduleRes.data.schedule && scheduleRes.data.schedule.length > 0) {
      console.log('\n📋 Sample schedule items:');
      scheduleRes.data.schedule.slice(0, 3).forEach((item, i) => {
        console.log(`${i + 1}. ${item.subject} - ${item.faculty} - ${item.room} (${item.day} ${item.time})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response error:', error.response.data);
    }
  }
}

testScheduleGeneration();
