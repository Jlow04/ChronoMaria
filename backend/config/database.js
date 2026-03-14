const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file (SUPABASE_URL + SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const keyMode = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon';
console.log(`✅ Supabase client initialized (${keyMode} key)`);

module.exports = supabase;
