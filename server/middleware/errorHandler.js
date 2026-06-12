export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;

  // Always log full error server-side
  console.error(`[Error] ${req.method} ${req.url} → ${statusCode}`, err.message);
  if (!isProduction) console.error(err.stack);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(422).json({
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // SQLite constraint violations
  if (err.name === 'SqliteError') {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'A record with these details already exists.' });
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(422).json({ message: 'Related record not found or in use.' });
    }
    return res.status(500).json({
      message: 'Database error',
      ...(isProduction ? {} : { detail: err.message }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }

  // Generic fallback
  res.status(statusCode).json({
    message: isProduction ? 'An unexpected error occurred.' : (err.message || 'Internal server error'),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
