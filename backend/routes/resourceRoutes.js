const express = require("express");
const router = express.Router();
const db = require("../config/db");

const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// SECURITY FIX: every route below previously had no verifyToken check at
// all, meaning anyone with the URL (no login required) could browse the
// full content catalogue. This line requires a valid JWT for every route
// in this file, students/teachers/admins alike.
router.use(verifyToken);

// 1. Get all subjects
// FIX: subjects are now filtered to the logged-in student's own
// curriculum_id (taken from their JWT). Teachers/admins have no fixed
// curriculum, so they see everything by default, or can filter manually
// with ?curriculum_id=1
router.get("/subjects", async (req, res) => {
  try {
    const curriculumId =
      req.user.role === "student"
        ? req.user.curriculum_id
        : req.query.curriculum_id;

    let queryText = "SELECT * FROM subjects";
    const params = [];

    if (curriculumId) {
      queryText += " WHERE curriculum_id = $1";
      params.push(curriculumId);
    }

    const { rows } = await db.query(queryText, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Database reading error" });
  }
});

// 2. Get chapters/units for a specific subject
router.get("/subjects/:subjectId/units", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const queryText =
      "SELECT * FROM units WHERE subject_id = $1 ORDER BY unit_number ASC;";
    const { rows } = await db.query(queryText, [subjectId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error pulling units" });
  }
});

// 3. Get individual topics/lessons for a specific chapter
router.get("/units/:unitId/topics", async (req, res) => {
  try {
    const { unitId } = req.params;
    const queryText =
      "SELECT * FROM topics WHERE unit_id = $1 ORDER BY topic_code ASC;";
    const { rows } = await db.query(queryText, [unitId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error pulling topics" });
  }
});

// 4. Get all study notes/PDFs for a specific topic
router.get("/topics/:topicId/notes", async (req, res) => {
  try {
    const { topicId } = req.params;
    const queryText =
      "SELECT * FROM notes WHERE topic_id = $1 ORDER BY sequence_order ASC;";
    const { rows } = await db.query(queryText, [topicId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Error pulling study notes" });
  }
});

// 5. Get all YouTube explanation videos for a specific topic
router.get("/topics/:topicId/videos", async (req, res) => {
  try {
    const { topicId } = req.params;
    const queryText =
      "SELECT * FROM videos WHERE topic_id = $1 ORDER BY sequence_order ASC;";
    const { rows } = await db.query(queryText, [topicId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Error pulling topic videos" });
  }
});

// 6. POST Route: Upload/Link a new video item to a topic (LOCKED DOWN)
// verifyToken already applied above; requireRole further restricts this
// one route to teachers and admins only.
router.post(
  "/topics/:topicId/videos",
  requireRole(["teacher", "admin"]),
  async (req, res) => {
    try {
      const { topicId } = req.params;
      const { title, youtube_video_id, sequence_order } = req.body;

      const queryText = `
      INSERT INTO videos (topic_id, title, youtube_video_id, sequence_order) 
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
      const { rows } = await db.query(queryText, [
        topicId,
        title,
        youtube_video_id,
        sequence_order || 1,
      ]);
      res.status(201).json({
        success: true,
        message: "Video linked successfully!",
        data: rows[0],
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, error: "Error saving video link" });
    }
  },
);

module.exports = router;
