const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
  try {
    console.log('📋 Fetching departments...\n');

    const { data, error, status } = await supabase
      .from('departments')
      .select('*')
      .order('department_id');

    console.log('Response status:', status);

    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Departments found:', data.length);
      console.log(JSON.stringify(data, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDepartments();
