// FocusFlow Security Implementation
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Security Configuration
const SECURITY_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex'),
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // Password Configuration
  BCRYPT_SALT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX: 5, // Stricter for auth endpoints
  
  // Session Configuration
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_SESSIONS_PER_USER: 5,
  
  // Security Headers
  CORS_ORIGINS: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
};

class SecurityManager {
  constructor() {
    this.config = SECURITY_CONFIG;
  }

  // Password Management
  async hashPassword(password) {
    if (!this.validatePassword(password)) {
      throw new Error('Password does not meet security requirements');
    }
    
    return bcrypt.hash(password, this.config.BCRYPT_SALT_ROUNDS);
  }

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  validatePassword(password) {
    const minLength = this.config.PASSWORD_MIN_LENGTH;
    const maxLength = this.config.PASSWORD_MAX_LENGTH;
    
    if (password.length < minLength || password.length > maxLength) {
      return false;
    }
    
    // Must contain at least one uppercase, one lowercase, one number, and one special character
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  // JWT Token Management
  generateAccessToken(payload) {
    return jwt.sign(payload, this.config.JWT_SECRET, {
      expiresIn: this.config.JWT_EXPIRES_IN,
      issuer: 'focusflow-api',
      audience: 'focusflow-client',
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, this.config.JWT_REFRESH_SECRET, {
      expiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'focusflow-api',
      audience: 'focusflow-client',
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.config.JWT_SECRET, {
        issuer: 'focusflow-api',
        audience: 'focusflow-client',
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.config.JWT_REFRESH_SECRET, {
        issuer: 'focusflow-api',
        audience: 'focusflow-client',
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Input Validation and Sanitization
  validateEmail(email) {
    return validator.isEmail(email) && validator.isLength(email, { min: 5, max: 255 });
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return validator.escape(input.trim());
  }

  validateUUID(uuid) {
    return validator.isUUID(uuid);
  }

  // Rate Limiting Configuration
  createRateLimiter(options = {}) {
    const defaultOptions = {
      windowMs: this.config.RATE_LIMIT_WINDOW,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(this.config.RATE_LIMIT_WINDOW / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  createAuthRateLimiter() {
    return this.createRateLimiter({
      max: this.config.AUTH_RATE_LIMIT_MAX,
      skipSuccessfulRequests: true,
    });
  }

  // Security Headers Configuration
  getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "https://avatars.githubusercontent.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", process.env.API_URL],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    };
  }

  // CORS Configuration
  getCorsConfig() {
    return {
      origin: (origin, callback) => {
        if (!origin || this.config.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400, // 24 hours
    };
  }

  // Session Management
  async createSession(userId, deviceInfo, ipAddress) {
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(sessionToken, 10);
    
    const session = {
      id: sessionId,
      userId,
      tokenHash,
      deviceInfo: deviceInfo || {},
      ipAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.SESSION_TIMEOUT),
      lastAccessAt: new Date(),
    };

    return { session, sessionToken };
  }

  async validateSession(sessionToken, storedSession) {
    if (!storedSession || storedSession.expiresAt < new Date()) {
      return false;
    }

    const isValid = await bcrypt.compare(sessionToken, storedSession.tokenHash);
    
    if (isValid) {
      // Update last access time
      storedSession.lastAccessAt = new Date();
    }

    return isValid;
  }

  // Data Encryption for Sensitive Data
  encryptSensitiveData(data, encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, encryptionKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decryptSensitiveData(encryptedData, encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(
      algorithm,
      encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Audit Logging
  createAuditLog(userId, action, resource, details = {}) {
    const auditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      timestamp: new Date().toISOString(),
    };

    // In production, this would be sent to a secure logging service
    console.log('AUDIT_LOG:', JSON.stringify(auditLog));
    
    return auditLog;
  }

  // Security Monitoring
  detectSuspiciousActivity(userActivity) {
    const suspiciousPatterns = [
      // Multiple failed login attempts
      {
        name: 'multiple_failed_logins',
        condition: (activity) => activity.failedLogins > 5,
        severity: 'high',
      },
      // Login from unusual location
      {
        name: 'unusual_location',
        condition: (activity) => activity.isNewLocation,
        severity: 'medium',
      },
      // Rapid password changes
      {
        name: 'rapid_password_changes',
        condition: (activity) => activity.passwordChanges > 2,
        severity: 'medium',
      },
      // Unusual access patterns
      {
        name: 'unusual_access_pattern',
        condition: (activity) => activity.unusualTimeAccess,
        severity: 'low',
      },
    ];

    const detected = [];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.condition(userActivity)) {
        detected.push({
          type: pattern.name,
          severity: pattern.severity,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return detected;
  }

  // Security Headers Middleware
  securityHeaders() {
    return helmet(this.getHelmetConfig());
  }

  // Input Sanitization Middleware
  sanitizeRequest() {
    return (req, res, next) => {
      // Sanitize query parameters
      if (req.query) {
        for (const key in req.query) {
          req.query[key] = this.sanitizeInput(req.query[key]);
        }
      }

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
          if (typeof req.body[key] === 'string') {
            req.body[key] = this.sanitizeInput(req.body[key]);
          }
        }
      }

      next();
    };
  }

  // Authentication Middleware
  authenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Access token required' });
        }

        const token = authHeader.substring(7);
        const decoded = this.verifyAccessToken(token);
        
        // Attach user info to request
        req.user = {
          id: decoded.userId,
          type: decoded.type,
        };

        // Create audit log
        this.createAuditLog(
          decoded.userId,
          'api_access',
          req.path,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          }
        );

        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }

  // Role-based Access Control
  authorize(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // In a real implementation, you would check user roles from database
      // For now, we'll assume all authenticated users have access
      next();
    };
  }

  // CSRF Protection (for state-changing operations)
  csrfProtection() {
    return (req, res, next) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const csrfToken = req.get('X-CSRF-Token');
      const sessionToken = req.session?.csrfToken;

      if (!csrfToken || csrfToken !== sessionToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }
}

// Security Utilities
class SecurityUtils {
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateApiKey() {
    const prefix = 'ff_'; // FocusFlow prefix
    const key = crypto.randomBytes(24).toString('base64');
    return `${prefix}${key}`;
  }

  static hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  static validateApiKey(apiKey, hashedKey) {
    const hashedInput = SecurityUtils.hashApiKey(apiKey);
    return hashedInput === hashedKey;
  }

  static generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static isValidUrl(url) {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  }

  static sanitizeHtml(html) {
    // In a real implementation, use a library like DOMPurify
    return validator.escape(html);
  }

  static generateSecureFilename(originalName) {
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}.${ext}`;
  }
}

module.exports = {
  SecurityManager,
  SecurityUtils,
  SECURITY_CONFIG,
};
