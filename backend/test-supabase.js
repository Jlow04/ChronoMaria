const supabase = require('./config/database');

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase REST API connection...\n');
  
  try {
    // Test connection by fetching tables
    const { data: tables, error: tablesError } = await supabase
      .from('faculty')
      .select('id', { count: 'exact', head: true });
    
    if (tablesError) {
      throw tablesError;
    }
    
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Check each table
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('*', { count: 'exact' });
    
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*', { count: 'exact' });
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' });
    
    console.log('📊 Database Status:');
    console.log('   Faculty:', faculty?.length || 0, 'records');
    console.log('   Subjects:', subjects?.length || 0, 'records');
    console.log('   Rooms:', rooms?.length || 0, 'records');
    
    if (faculty && faculty.length > 0) {
      console.log('\n📋 Sample Faculty:');
      faculty.slice(0, 3).forEach(f => {
        console.log(`   - ${f.name} (${f.department})`);
      });
    }
    
    console.log('\n✨ All systems operational!');
    console.log('🚀 You can now start the backend with: npm start');
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('\nError:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Tables not found! Please:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/bgetctcanncenczqebrt/sql/new');
      console.log('   2. Copy contents of database_setup.sql');
      console.log('   3. Paste and Run in SQL Editor');
    } else if (error.message.includes('JWT')) {
      console.log('\n💡 Authentication issue. Check your SUPABASE_ANON_KEY in .env');
    } else {
      console.log('\n💡 Check your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY');
    }
  }
}

testSupabaseConnection();
