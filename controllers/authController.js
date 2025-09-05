const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    let existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log(`Signup failed: Email ${email} already exists`);
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    existingUser = await User.findByUsername(username);
    if (existingUser) {
      console.log(`Signup failed: Username ${username} already exists`);
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userId = await User.create({ name, username, email, password, role });

    res.status(201).json({
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};