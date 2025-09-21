const jwt = require("jsonwebtoken");

// Authentication middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded user info to request
    next();
  } catch (err) {
    return res.status(403).json({ authenticated: false });
  }
}

module.exports = authMiddleware;
