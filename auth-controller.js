// Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, UserSession } = require('../models');
const { validateEmail, validatePassword } = require('../utils/validators');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const logger = require('../utils/logger');

class AuthController {
  // Register new user
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, timezone } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['email', 'password', 'firstName', 'lastName'],
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await User.create({
        email,
        passwordHash,
        firstName,
        lastName,
        timezone: timezone || 'UTC',
      });

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully. Please check your email for verification.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  // Login user
  static async login(req, res, next) {
    try {
      const { email, password, deviceInfo } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user.id, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store session
      const session = await UserSession.create({
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        deviceInfo: deviceInfo || {},
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Update last login
      await User.updateLastLogin(user.id);

      logger.info(`User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          timezone: user.timezone,
          subscriptionTier: user.subscriptionTier,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      // Find valid session
      const sessions = await UserSession.findByUserId(decoded.userId);
      const validSession = sessions.find(async (session) => {
        return await bcrypt.compare(refreshToken, session.tokenHash);
      });

      if (!validSession || validSession.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  // Logout user
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;

      if (refreshToken) {
        // Remove specific session
        const sessions = await UserSession.findByUserId(userId);
        for (const session of sessions) {
          if (await bcrypt.compare(refreshToken, session.tokenHash)) {
            await UserSession.delete(session.id);
            break;
          }
        }
      } else {
        // Remove all sessions for user
        await UserSession.deleteByUserId(userId);
      }

      logger.info(`User logged out: ${userId}`);

      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  // Verify email
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'email_verification') {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.emailVerified) {
        return res.json({ message: 'Email already verified' });
      }

      await User.verifyEmail(decoded.userId);

      logger.info(`Email verified: ${user.email}`);

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      logger.error('Email verification error:', error);
      next(error);
    }
  }

  // Request password reset
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If email exists, password reset instructions have been sent' });
      }

      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await sendPasswordResetEmail(email, resetToken);

      logger.info(`Password reset requested: ${email}`);

      res.json({ message: 'If email exists, password reset instructions have been sent' });
    } catch (error) {
      logger.error('Password reset request error:', error);
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          error: 'Token and new password are required',
        });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await User.updatePassword(decoded.userId, passwordHash);
      await UserSession.deleteByUserId(decoded.userId); // Invalidate all sessions

      logger.info(`Password reset completed for user: ${decoded.userId}`);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      logger.error('Password reset error:', error);
      next(error);
    }
  }
}

module.exports = AuthController;
