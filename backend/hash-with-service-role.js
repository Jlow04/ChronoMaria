/**
 * Hash password using RLS-enabled anon key with update_credentials policy
 */

const supabase = require('./config/database');
const bcrypt = require('bcrypt');

async function hashPassword() {
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
    console.log('Current password in database:', user.password_hash);

    // Hash plaintext password
    const hashedPassword = await bcrypt.hash('admin', 10);
    console.log('New hashed password:', hashedPassword);

    // Update using service role (bypasses RLS)
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return;
    }

    console.log('✅ Password hashed and updated!');

    // Verify
    const { data: verifyUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('✓ Verified - Password in database:', verifyUser.password_hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();
