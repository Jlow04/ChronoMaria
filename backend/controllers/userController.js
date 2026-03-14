const User = require('../models/User');
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

    console.log(`✅ Login successful for user: ${username}`);

    // Don't return password_hash
    const { password_hash: _, ...userWithoutPassword } = user;

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

// Hash password helper
exports.hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
