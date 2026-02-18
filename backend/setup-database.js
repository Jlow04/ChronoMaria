const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the SQL setup file
const sqlFilePath = path.join(__dirname, '..', 'database_setup.sql');
const setupSQL = fs.readFileSync(sqlFilePath, 'utf8');

// Connect to PostgreSQL (to create database)
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Connect to default database first
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Step 1: Check if database exists
    console.log('Checking if database exists...');
    const dbCheckResult = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'chronomaria']
    );

    // Step 2: Create database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      console.log(`Creating database: ${process.env.DB_NAME || 'chronomaria'}`);
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'chronomaria'}`);
      console.log('✅ Database created successfully!\n');
    } else {
      console.log('✅ Database already exists\n');
    }

    // Close admin connection
    await adminPool.end();

    // Step 3: Connect to the new database and run setup script
    console.log('Connecting to chronomaria database...');
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'chronomaria'
    });

    console.log('Running setup script...');
    await dbPool.query(setupSQL);
    console.log('✅ Tables created successfully!\n');

    // Step 4: Verify setup
    console.log('Verifying database setup...');
    const tableCheck = await dbPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check sample data
    const facultyCount = await dbPool.query('SELECT COUNT(*) FROM faculty');
    const subjectCount = await dbPool.query('SELECT COUNT(*) FROM subjects');
    const roomCount = await dbPool.query('SELECT COUNT(*) FROM rooms');

    console.log('\n📊 Sample data inserted:');
    console.log(`   - Faculty: ${facultyCount.rows[0].count} records`);
    console.log(`   - Subjects: ${subjectCount.rows[0].count} records`);
    console.log(`   - Rooms: ${roomCount.rows[0].count} records`);

    await dbPool.end();

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n🎉 You can now start the backend server with: npm start');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Make sure PostgreSQL is installed and running');
    console.error('   2. Check your .env file has correct credentials');
    console.error('   3. Verify DB_PASSWORD is set correctly');
    console.error('   4. Try connecting manually: psql -U postgres');
    process.exit(1);
  }
}

// Run setup
console.log('═══════════════════════════════════════════════');
console.log('  ChronoMaria Database Setup');
console.log('═══════════════════════════════════════════════\n');

setupDatabase();
