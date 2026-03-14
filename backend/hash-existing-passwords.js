/**
 * Migration script to hash existing plaintext passwords
 * Run this ONCE to hash all existing passwords in the database
 */

const supabase = require('./config/database');
const bcrypt = require('bcrypt');

async function hashExistingPasswords() {
  try {
    console.log('🔄 Starting password hashing migration...');

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${users.length} users to hash`);

    // Hash each password
    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (user.password_hash.startsWith('$2a$') || 
            user.password_hash.startsWith('$2b$') || 
            user.password_hash.startsWith('$2y$')) {
          console.log(`⏭️  User ${user.username} already has hashed password, skipping...`);
          continue;
        }

        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(user.password_hash, 10);
        
        // Update database
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.username}:`, updateError);
        } else {
          console.log(`✅ Hashed password for user: ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.username}:`, error);
      }
    }

    console.log('✅ Password hashing migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

hashExistingPasswords();
