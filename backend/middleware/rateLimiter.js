const rateLimit = require("express-rate-limit");

// Limits repeated login/signup attempts from the same device,
// to slow down brute-force and credential-stuffing attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      "Too many attempts from this device. Please wait a few minutes and try again.",
  },
});

module.exports = { authLimiter };
