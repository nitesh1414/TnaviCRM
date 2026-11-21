const jwt = require('jsonwebtoken');
const { context } = require('../utils/access');
const db = require('../utils/db');

const SECRET = process.env.JWT_SECRET || 'tnavicrm-dev-secret';

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = db.find('users', decoded.id);
    if (!user || user.active === false) return res.status(401).json({ success: false, message: 'User not found' });
    const { password, ...safe } = user;
    req.user = safe;
    context.run(safe, next);
  } catch { return res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied for your role' });
    next();
  };
}
module.exports = { auth, requireRole, SECRET };
