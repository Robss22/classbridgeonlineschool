const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Protect everything here—only Teachers and Admins should manage marks/comments
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken, requireRole(["teacher", "admin"]));

// 1. POST: Record or update terminal marks and progress comments for a student
router.post("/record-marks", async (req, res) => {
  const { student_id, subject_id, exam_score, total_possible, term_comments } =
    req.body;

  if (!student_id || !subject_id || exam_score === undefined) {
    return res.status(400).json({
      success: false,
      error: "Student ID, Subject ID, and Exam Score parameters are required.",
    });
  }

  try {
    // Upsert pattern: inserts new record, or updates existing record if student+subject entry already exists
    const queryText = `
      INSERT INTO student_marks (student_id, subject_id, exam_score, total_possible, term_comments, evaluated_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (student_id, subject_id) 
      DO UPDATE SET 
        exam_score = EXCLUDED.exam_score,
        total_possible = EXCLUDED.total_possible,
        term_comments = EXCLUDED.term_comments,
        evaluated_by = EXCLUDED.evaluated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const { rows } = await db.query(queryText, [
      student_id,
      subject_id,
      exam_score,
      total_possible || 100,
      term_comments,
      req.user.user_id, // The teacher logged in
    ]);

    res.status(200).json({
      success: true,
      message:
        "Academic record updated successfully inside terminal tracking register.",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Internal registry failure recording academic marks.",
    });
  }
});

// 2. GET: Retrieve a complete terminal report breakdown for a specific student
router.get("/student-report/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const queryText = `
      SELECT 
        sm.exam_score, 
        sm.total_possible, 
        sm.term_comments, 
        sub.subject_name,
        u.username as evaluator
      FROM student_marks sm
      JOIN subjects sub ON sm.subject_id = sub.subject_id
      LEFT JOIN users u ON sm.evaluated_by = u.user_id
      WHERE sm.student_id = $1;
    `;

    const { rows } = await db.query(queryText, [studentId]);

    res.status(200).json({
      success: true,
      student_id: studentId,
      report_card: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Internal error compiling terminal performance records.",
    });
  }
});

module.exports = router;
