const supabase = require('./config/database');

async function addDepartmentColumnToUsers() {
  try {
    console.log('📋 Adding department_id column to users table...\n');

    // Check if column exists by trying to select it
    const { data: checkData, error: checkError } = await supabase
      .from('users')
      .select('department_id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Column already exists!');
      process.exit(0);
    }

    // If we get here, column doesn't exist - we need to add it via raw SQL
    console.log('⚠️  Note: Please run this SQL in your Supabase SQL Editor:\n');
    console.log(`
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id);
ALTER TABLE users ALTER COLUMN department_id DROP NOT NULL;
    `);

    console.log('\nAfter running the SQL, try creating a user again.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addDepartmentColumnToUsers();
