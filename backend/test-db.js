const pool = require('./config/database');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('   Current time from database:', result.rows[0].now);
    
    // Check if tables exist
    console.log('\nChecking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Please run the database_setup.sql in Supabase SQL Editor.');
    } else {
      console.log('✅ Tables found:');
      tables.rows.forEach(row => console.log('   -', row.table_name));
      
      // Check sample data
      const facultyCount = await pool.query('SELECT COUNT(*) FROM faculty');
      const subjectCount = await pool.query('SELECT COUNT(*) FROM subjects');
      const roomCount = await pool.query('SELECT COUNT(*) FROM rooms');
      
      console.log('\n📊 Data summary:');
      console.log('   Faculty:', facultyCount.rows[0].count, 'records');
      console.log('   Subjects:', subjectCount.rows[0].count, 'records');
      console.log('   Rooms:', roomCount.rows[0].count, 'records');
    }
    
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('\nError:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   1. Database password is incorrect');
    console.log('   2. Tables not created yet (run database_setup.sql in Supabase)');
    console.log('   3. Network/firewall blocking connection');
    console.log('   4. Supabase project is paused/inactive');
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
