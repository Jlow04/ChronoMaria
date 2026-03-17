const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log(`🔐 Login attempt - Username: "${username}"`);
    
    const user = await User.getByUsername(username);
    if (!user) {
      console.log(`❌ User not found: "${username}"`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    console.log(`✓ User found`);

    // Compare password with hashed password_hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.log(`❌ Password mismatch`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log(`❌ User account is inactive: "${username}"`);
      return res.status(403).json({ error: 'User must ask for Authorization' });
    }

    console.log(`✅ Login successful for user: ${username}`);

    // Don't return password_hash
    const { password_hash: _, ...userWithoutPassword } = user;

    // Log audit event for login
    try {
      const auditResult = await AuditLog.create({
        admin_username: username,
        action: 'USER_LOGIN',
        target_username: username,
        details: `User logged in to their account`,
        created_at: new Date().toISOString()
      });
    } catch (auditError) {
      console.error(`❌ Failed to log login audit event for user ${username}:`, auditError);
    }

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, password, email, admin_username } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log(`📝 Creating user - Username: "${username}"`);

    // Check if user already exists
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      console.log(`❌ User already exists: "${username}"`);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const newUser = await User.create({
      username,
      password_hash: hashedPassword,
      email: email || null,
      role: 'Admin',
      is_active: true
    });

    console.log(`✅ User created successfully: ${username}`);

    // Log audit event
    try {
      await AuditLog.create({
        admin_username: admin_username || 'Super Admin',
        action: 'USER_CREATED',
        target_username: username,
        details: `Created user: ${username} with email: ${email || 'N/A'}`,
        created_at: new Date().toISOString()
      });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    // Don't return password_hash
    const { password_hash: _, ...userWithoutPassword } = newUser;

    res.json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

// Hash password helper
exports.hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, admin_username } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📝 Updating user ${id} - Role: ${role}, Active: ${is_active}`);

    // Get current user data for audit logging
    const allUsers = await User.getAll();
    const oldUser = allUsers.find(u => u.id === parseInt(id));

    const updateData = {};
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedUser = await User.update(id, updateData);

    console.log(`✅ User updated successfully: ${id}`);

    // Log audit event
    try {
      let actionDetails = [];
      if (role && oldUser?.role !== role) {
        actionDetails.push(`Role changed from ${oldUser?.role || 'N/A'} to ${role}`);
      }
      if (is_active !== undefined && oldUser?.is_active !== is_active) {
        actionDetails.push(`Active status changed from ${oldUser?.is_active ? 'Yes' : 'No'} to ${is_active ? 'Yes' : 'No'}`);
      }

      if (actionDetails.length > 0) {
        await AuditLog.create({
          admin_username: admin_username || 'Super Admin',
          action: 'USER_UPDATED',
          target_username: oldUser?.username || `User ID: ${id}`,
          details: actionDetails.join('; '),
          created_at: new Date().toISOString()
        });
      }
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_username } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🗑️  Deleting user ${id}`);

    // Get user data for audit logging before deletion
    const allUsers = await User.getAll();
    const userToDelete = allUsers.find(u => u.id === parseInt(id));

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await User.delete(id);

    console.log(`✅ User deleted successfully: ${userToDelete.username}`);

    // Log audit event
    try {
      await AuditLog.create({
        admin_username: admin_username || 'Super Admin',
        action: 'USER_DELETED',
        target_username: userToDelete.username,
        details: `Deleted user: ${userToDelete.username} (Email: ${userToDelete.email || 'N/A'})`,
        created_at: new Date().toISOString()
      });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    res.json({
      message: 'User deleted successfully',
      deletedUsername: userToDelete.username
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
};
