const supabase = require('../config/database');

async function migrate() {
  console.log('🔄 Running migration: Fix user department column...\n');

  try {
    // Check if 'department' column exists and has a default
    console.log('📋 Checking users table for department column...');

    const sql = `
-- Step 1: Update existing users with 'guest' department to have proper department from department_id
UPDATE users
SET department = d.department_name
FROM departments d
WHERE users.department_id = d.department_id
  AND (users.department IS NULL OR users.department = 'guest');

-- Step 2: Add a trigger to automatically set department when department_id changes
CREATE OR REPLACE FUNCTION update_user_department()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.department_id IS NOT NULL THEN
    SELECT department_name INTO NEW.department
    FROM departments
    WHERE department_id = NEW.department_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_department_trigger ON users;
CREATE TRIGGER user_department_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_department();

-- Step 3: Set any remaining 'guest' values to NULL to let the trigger set them
UPDATE users
SET department = NULL
WHERE department = 'guest' AND department_id IS NOT NULL;
    `;

    console.log('⚠️  Please run this SQL in your Supabase SQL Editor:\n');
    console.log(sql);

    console.log('\n✅ After running the SQL:');
    console.log('1. All existing users with department_id will be mapped to their department names');
    console.log('2. New users created will automatically have their department set based on department_id');
    console.log('3. Restart your backend server');
    console.log('4. Try creating a new user - the department should now be saved correctly');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run migration
migrate();
