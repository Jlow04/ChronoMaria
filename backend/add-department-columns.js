const supabase = require('./config/database');

async function addDepartmentColumns() {
  try {
    console.log('📋 Adding department_id columns to faculty and subjects tables...\n');

    console.log('⚠️  Please run this SQL in your Supabase SQL Editor:\n');

    const sql = `
-- Add department_id to faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id);

-- Add department_id to subjects table
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id);

-- Add department_id to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id);
    `;

    console.log(sql);

    console.log('\n✅ After running the SQL:');
    console.log('1. Map your existing faculty/subjects/rooms to departments');
    console.log('2. Set the department_id based on their current department name');
    console.log('3. Then restart your backend server');
    console.log('4. Refresh the browser');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addDepartmentColumns();
