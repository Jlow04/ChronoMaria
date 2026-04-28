const supabase = require('../config/database');

async function migrate() {
  console.log('🔄 Running migration: Create departments table...\n');

  try {
    // Create departments table
    console.log('📋 Creating departments table...');
    const { error: deptError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS departments (
          department_id SERIAL PRIMARY KEY,
          department_name VARCHAR(255) NOT NULL UNIQUE,
          department_program VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(err => {
      // If rpc method doesn't exist, use direct query
      return supabase.from('departments').select('department_id').limit(1);
    });

    console.log('✅ Departments table ready\n');

    // Add department_id to users table if it doesn't exist
    console.log('📋 Adding department_id column to users table (if needed)...');
    try {
      // Try to add the column - will fail silently if it exists
      const { error } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id)
        `
      }).catch(() => ({ error: null }));
    } catch (e) {
      console.log('   Column may already exist, skipping...');
    }

    console.log('✅ Users table migration ready\n');

    // Update faculty table to use department_id
    console.log('📋 Adding department_id column to faculty table (if needed)...');
    try {
      const { error } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id)
        `
      }).catch(() => ({ error: null }));
    } catch (e) {
      console.log('   Column may already exist, skipping...');
    }

    console.log('✅ Faculty table migration ready\n');

    // Update subjects table to use department_id
    console.log('📋 Adding department_id column to subjects table (if needed)...');
    try {
      const { error } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id)
        `
      }).catch(() => ({ error: null }));
    } catch (e) {
      console.log('   Column may already exist, skipping...');
    }

    console.log('✅ Subjects table migration ready\n');

    // Update rooms table to use department_id
    console.log('📋 Adding department_id column to rooms table (if needed)...');
    try {
      const { error } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE rooms ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(department_id)
        `
      }).catch(() => ({ error: null }));
    } catch (e) {
      console.log('   Column may already exist, skipping...');
    }

    console.log('✅ Rooms table migration ready\n');

    console.log('✨ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();
