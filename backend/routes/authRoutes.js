const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Assuming your Sequelize setup is here
const User = db.user; // Access the User model
const { verifyToken } = require('../middleware/authMiddleware'); // Import verifyToken
const { Op } = require('sequelize'); // For OR queries if checking existing username

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  console.log('[AuthRoutes] POST /register: Received registration request for username:', req.body.username);
  try {
    const { username, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      console.log('[AuthRoutes] POST /register: Failed - User already exists:', username);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'member' // Default to 'member' if role is not provided
    });
    console.log('[AuthRoutes] POST /register: Success - User registered:', newUser.username, 'ID:', newUser.id);
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('[AuthRoutes] POST /register: Error during registration for', req.body.username, error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  console.log('[AuthRoutes] POST /login: Received login request for username:', req.body.username);
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('[AuthRoutes] POST /login: Failed - User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[AuthRoutes] POST /login: Failed - Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';

    if (!jwtSecret) {
      console.error('[AuthRoutes] POST /login: JWT_SECRET is not defined in environment variables. Aborting token generation.');
      return res.status(500).json({ message: 'Server configuration error: JWT secret missing.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    console.log(`[AuthRoutes] POST /login: Success - User logged in: ${user.username}, ID: ${user.id}. Token expires in: ${jwtExpiresIn}`);
    res.json({ token, userId: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error('[AuthRoutes] POST /login: Error during login for', req.body.username, error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Update User Profile (e.g., username)
router.put('/user/profile', verifyToken, async (req, res) => {
  const userId = req.userId; // From verifyToken middleware
  const { username: newUsername } = req.body;

  console.log(`[AuthRoutes] PUT /user/profile: User ID ${userId} attempting to update username to '${newUsername}'`);

  if (!newUsername || typeof newUsername !== 'string' || newUsername.trim() === '') {
    console.log(`[AuthRoutes] PUT /user/profile: Failed for User ID ${userId} - New username is required and must be a non-empty string.`);
    return res.status(400).json({ message: 'New username is required and must be a non-empty string.' });
  }

  try {
    // Check if the new username is already taken by another user
    const existingUserWithNewName = await User.findOne({
      where: {
        username: newUsername,
        id: { [Op.ne]: userId } // Op.ne means "not equal"
      }
    });

    if (existingUserWithNewName) {
      console.log(`[AuthRoutes] PUT /user/profile: Failed for User ID ${userId} - Username '${newUsername}' is already taken.`);
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    // Find the user to update
    const userToUpdate = await User.findByPk(userId);
    if (!userToUpdate) {
      // This case should ideally not happen if verifyToken works correctly
      console.error(`[AuthRoutes] PUT /user/profile: Critical - User ID ${userId} not found after token verification.`);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update the username
    userToUpdate.username = newUsername.trim();
    await userToUpdate.save();

    console.log(`[AuthRoutes] PUT /user/profile: Success - User ID ${userId} updated username to '${newUsername}'.`);
    // Return relevant user info (excluding password)
    res.json({
      userId: userToUpdate.id,
      username: userToUpdate.username,
      role: userToUpdate.role,
      message: 'Profile updated successfully.'
    });

  } catch (error) {
    console.error(`[AuthRoutes] PUT /user/profile: Error updating profile for User ID ${userId}:`, error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
});

module.exports = router;