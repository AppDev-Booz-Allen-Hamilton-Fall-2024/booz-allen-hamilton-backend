const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm || searchTerm.trim().length < 3) {
    return res.status(400).json({ error: "Query must have at least 3 characters" });
  }

  try {
    const trimmedSearchTerm = searchTerm.trim();
    const result = await db.query(
      `
      SELECT 
        p.policy_id,
        p.policy_name,
        p.nickname,
        STRING_AGG(DISTINCT c.category, ', ') AS categories,
        p.effective_date,
        p.expiration_date,
        p.og_file_path,
        parent.policy_id AS parent_id,
        parent.policy_name AS parent_name
      FROM policy p
      LEFT JOIN category c ON p.policy_id = c.policy_id
      LEFT JOIN policy parent ON p.parent_policy_id = parent.policy_id
      WHERE 
        p.policy_name ILIKE '%' || $1 || '%'
        OR p.nickname ILIKE '%' || $1 || '%'
        OR c.category ILIKE '%' || $1 || '%'
        OR parent.policy_name ILIKE '%' || $1 || '%'
      GROUP BY 
        p.policy_id, p.policy_name, p.nickname, p.effective_date, 
        p.expiration_date, p.og_file_path, parent.policy_id, parent.policy_name
      ORDER BY 
        p.policy_name ASC;
      `,
      [trimmedSearchTerm]
    );

    res.json({ policies: result.rows });
  } catch (error) {
    console.error("Error executing search query:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
