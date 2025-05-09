const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.user;

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  console.log(`[AuthMiddleware] verifyToken: Attempting to verify token for ${req.method} ${req.originalUrl}`);
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[AuthMiddleware] verifyToken: Failed - No Bearer token provided.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('[AuthMiddleware] verifyToken: Token found, attempting verification.');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[AuthMiddleware] verifyToken: JWT_SECRET is not defined in environment variables. Cannot verify token.');
    // Do not explicitly tell client about server config error, just that token is invalid or auth failed.
    return res.status(403).json({ message: 'Forbidden: Token verification failed.' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error('[AuthMiddleware] verifyToken: Failed - Invalid token.', err.message);
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    console.log(`[AuthMiddleware] verifyToken: Success - User ID: ${decoded.userId}, Role: ${decoded.role}`);
    next();
  });
};

// Middleware to check for specific roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(`[AuthMiddleware] authorizeRoles: Checking roles for User ID: ${req.userId}, Role: ${req.userRole}. Allowed: ${allowedRoles.join(', ')}`);
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      console.log(`[AuthMiddleware] authorizeRoles: Failed - User role '${req.userRole}' not in allowed roles.`);
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    console.log(`[AuthMiddleware] authorizeRoles: Success - User role '${req.userRole}' is authorized.`);
    next();
  };
};

// Example of a more granular permission check (can be expanded)
const authorizePermission = (permission) => {
  return async (req, res, next) => {
    const userRole = req.userRole; // Already set by verifyToken
    console.log(`[AuthMiddleware] authorizePermission: Checking permission '${permission}' for User ID: ${req.userId}, Role: ${userRole}`);

    let hasPermission = false;
    const rolePermissions = {
      admin: ['manage_users', 'manage_books', 'view_logs'],
      librarian: ['manage_books', 'view_logs', 'view_books'],
      member: ['view_books']
    };

    if (rolePermissions[userRole] && rolePermissions[userRole].includes(permission)) {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log(`[AuthMiddleware] authorizePermission: Failed - Role '${userRole}' does not have permission '${permission}'.`);
      return res.status(403).json({ message: `Forbidden: Requires ${permission} permission` });
    }
    console.log(`[AuthMiddleware] authorizePermission: Success - Role '${userRole}' has permission '${permission}'.`);
    next();
  };
};


module.exports = {
  verifyToken,
  authorizeRoles,
  authorizePermission
};