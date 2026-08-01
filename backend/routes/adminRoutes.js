const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

// Import our professional, reusable middleware guards
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// 1. Staff Onboarding Endpoint
router.post(
  "/onboard-staff",
  verifyToken,
  requireRole(["admin"]),
  async (req, res) => {
    const { username, email, password, role, curricula_ids } = req.body;

    if (!["teacher", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid role assignment parameter." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user using the standardized `password_hash` column
      const queryText = `
      INSERT INTO users (username, email, password_hash, role, curriculum_id)
      VALUES ($1, $2, $3, $4, null)
      RETURNING user_id, username, email, role;
    `;

      const { rows } = await db.query(queryText, [
        username,
        email,
        hashedPassword,
        role,
      ]);

      const createdUser = rows[0];

      // If this is a teacher and curricula are provided, persist the teacher↔curriculum relations
      if (
        role === "teacher" &&
        Array.isArray(curricula_ids) &&
        curricula_ids.length > 0
      ) {
        try {
          const insertRelationQuery = `
            INSERT INTO teacher_curricula (teacher_id, curriculum_id)
            VALUES ($1, $2)
            ON CONFLICT (teacher_id, curriculum_id) DO NOTHING;
          `;

          for (const cid of curricula_ids) {
            await db.query(insertRelationQuery, [createdUser.user_id, cid]);
          }
        } catch (relErr) {
          console.error("Error saving teacher↔curriculum relations:", relErr);
          // Not failing the whole request; return warning to the client
          return res.status(201).json({
            success: true,
            message: `Staff member ${username} registered but curricula assignment partially failed.`,
            user: createdUser,
            warning: relErr.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Staff member ${username} registered successfully.`,
        user: createdUser,
      });
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Username or Email already exists inside system registry.",
        });
      }
      res.status(500).json({
        success: false,
        error: "Internal registry initialization failure.",
      });
    }
  },
);

// 2. Student Enrollment Endpoint
router.post(
  "/enroll-student",
  verifyToken,
  requireRole(["admin"]),
  async (req, res) => {
    const { username, email, password, curriculum_id } = req.body;

    if (!curriculum_id) {
      return res.status(400).json({
        success: false,
        error: "Curriculum assignment parameter is required for students.",
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const queryText = `
      INSERT INTO users (username, email, password_hash, role, curriculum_id)
      VALUES ($1, $2, $3, 'student', $4)
      RETURNING user_id, username, email, role, curriculum_id;
    `;

      const { rows } = await db.query(queryText, [
        username,
        email,
        hashedPassword,
        curriculum_id,
      ]);

      res.status(201).json({
        success: true,
        message: `Student ${username} enrolled successfully.`,
        user: rows[0],
      });
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Username or Email already exists inside system registry.",
        });
      }
      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          error:
            "Invalid Curriculum ID reference. This academic track does not exist.",
        });
      }
      res.status(500).json({
        success: false,
        error: "Internal registry student enrollment failure.",
      });
    }
  },
);

module.exports = router;
