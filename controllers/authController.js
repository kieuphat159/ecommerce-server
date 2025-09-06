const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });
}

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

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Signin body:", req.body);
    const user = await User.findByUsername(username);
    if (!user) {
      console.log(`Signin failed: Username ${username} not found`);
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`Signin failed: Invalid password for username ${username}`);
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const token = generateToken(user.id, user.role);
    res.status(200).json({ 
      message: 'Signin successful',
      token, 
      userId: user.id
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};