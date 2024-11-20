const express = require("express");
const router = express.Router();
const db = require("../db");

// Search policies with partial and exact matches
router.get("/", async (req, res) => {
  const { query, keyword } = req.query;

  if (!query && !keyword) {
    return res.status(400).json({ error: "Query parameter or keyword is required" });
  }

  try {
    const result = await db.query(
      `
      SELECT DISTINCT policy.*
      FROM policy
      LEFT JOIN keyword ON policy.policy_id = keyword.policy_id
      WHERE (
        policy.policy_name ILIKE '%' || $1 || '%' OR
        policy.nickname ILIKE '%' || $1 || '%' OR
        policy.categories ILIKE '%' || $1 || '%'
      )
      ${keyword ? "AND keyword.keyword = $2" : ""}
      `,
      keyword ? [query || "", keyword] : [query || ""]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error executing search query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
