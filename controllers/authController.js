const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });
}

const generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_REFRESH_KEY, { expiresIn: '10m'});
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
    const refreshToken = generateRefreshToken(user.id, user.role);
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      sameSite: 'None', secure : true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({ 
      message: 'Signin successfully',
      token, 
      userId: user.user_id,
      role: user.role
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    if (!req.cookies?.jwt) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const refreshToken = req.cookies.jwt;

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, async (err, decoded) => {
      if (err) {
        console.log('Refresh token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      try {
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(403).json({ message: 'User not found' });
        }

        const newAccessToken = generateToken(decoded.userId, decoded.role);
        
        const newRefreshToken = generateRefreshToken(decoded.userId, decoded.role);
        
        res.cookie('jwt', newRefreshToken, {
          httpOnly: true,
          sameSite: 'None',
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
          message: 'Token refreshed successfully',
          token: newAccessToken,
          expiresIn: '15m'
        });

      } catch (dbError) {
        console.error('Database error during refresh:', dbError);
        res.status(500).json({ message: 'Server error during token refresh' });
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};