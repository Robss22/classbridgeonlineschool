const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// 1. SIGNUP ROUTE - Registers a new STUDENT account only.
//
// SECURITY FIX: this route used to accept `role` straight from the request
// body (`role || "student"`), which meant anyone could POST
// { "role": "admin" } and self-provision an admin account. The role is now
// hardcoded to "student" here — the ONLY way to create a teacher or admin
// account is via the protected /api/admin/onboard-staff route, which
// requires an existing admin's JWT (see adminRoutes.js).
//
// BUG FIX: `curriculum_id` was previously read from req.body but never
// used in the INSERT, so every self-registered student ended up with
// curriculum_id = NULL. It is now required and saved.
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, curriculum_id } = req.body;

    if (!username || !email || !password || !curriculum_id) {
      return res.status(400).json({
        success: false,
        error: "Please enter username, email, password and select a curriculum",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const queryText = `
      INSERT INTO users (username, email, password_hash, role, curriculum_id) 
      VALUES ($1, $2, $3, 'student', $4) 
      RETURNING user_id, username, email, role, curriculum_id;
    `;
    const { rows } = await db.query(queryText, [
      username,
      email,
      passwordHash,
      curriculum_id,
    ]);

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        error: "Email or Username already registered",
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        error: "Invalid curriculum selected",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server authentication registration error",
    });
  }
});

// 2. LOGIN ROUTE - Authenticate user and issue JWT token
//
// FIX: curriculum_id is now included in the token payload and in the
// returned user object, so the frontend and the resource routes can filter
// content to the student's own curriculum without an extra DB lookup.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter all fields" });
    }

    const { rows } = await db.query("SELECT * FROM users WHERE email = $1;", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        curriculum_id: user.curriculum_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        curriculum_id: user.curriculum_id,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Server authentication login error" });
  }
});

module.exports = router;
