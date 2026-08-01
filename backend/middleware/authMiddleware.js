const jwt = require("jsonwebtoken");

// Security guard to verify if a user is logged in
const verifyToken = (req, res, next) => {
  // Grab the token from the Authorization header
  const authHeader = req.headers["authorization"];

  // Tokens are usually sent as "Bearer eyJhbGci...", so we split it to get just the string
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access denied. No token provided." });
  }

  try {
    // Verify the token using our JWT Secret Key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the verified user details directly to the request object
    req.user = decoded;

    // Pass the request forward to the next step
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired token." });
  }
};

// Security guard to restrict access based on roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure verifyToken ran first and attached the user profile
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Authorized roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
