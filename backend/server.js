const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 1. Imports / Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const { authLimiter } = require("./middleware/rateLimiter");
const app = express();

// 2. Middleware
// CORS is restricted to known frontend origins instead of "allow everyone".
// Set FRONTEND_URL in .env, comma-separated if you have more than one
// (e.g. FRONTEND_URL=http://localhost:5173,https://classbridge.app)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// 3. API Routes
// authLimiter only applies to /api/auth (login/signup) — the routes most
// worth protecting against brute-force / automated abuse.
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/performance", performanceRoutes);

// 4. Base Route
app.get("/", (req, res) => {
  res.send("ClassBridge School Server is running beautifully!");
});

// 5. Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `ClassBridge School Core Server is executing cleanly on Port ${PORT}`,
  );
});
