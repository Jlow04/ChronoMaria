const supabase = require('./config/database');
const bcrypt = require('bcrypt');

async function checkPassword() {
  try {
    // Get the admin user
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No admin user found');
      return;
    }

    const user = users[0];
    console.log('Current password_hash in database:', user.password_hash);
    console.log('Length:', user.password_hash.length);
    console.log('Is it hashed?', user.password_hash.startsWith('$2'));

    // Now hash the plaintext password and update it
    console.log('\n🔄 Hashing plaintext password "admin"...');
    const hashedPassword = await bcrypt.hash('admin', 10);
    console.log('New hashed password:', hashedPassword);

    // Update the database
    const { data, updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
    } else {
      console.log('✅ Password successfully hashed and updated in database');
      
      // Verify the update
      const { data: verifyUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('\n✓ Verification - New password in database:', verifyUser.password_hash);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPassword();
