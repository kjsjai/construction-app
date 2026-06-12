import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const isProduction = process.env.NODE_ENV === 'production';

export const authenticate = (req, res, next) => {
  // Primary: read from HttpOnly cookie (secure, preferred)
  let token = req.cookies?.accessToken;

  // Fallback: Bearer header (for API clients / development tools)
  if (!token) {
    token = req.header('Authorization')?.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db.prepare(
      'SELECT id, username, role, status FROM users WHERE id = ?'
    ).get(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
