const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/search", async (req, res) => {
  const { searchTerm, limit = 10, offset = 0 } = req.query;

  if (!searchTerm || searchTerm.trim().length < 4) {
    return res
      .status(400)
      .json({ error: "Query must have at least 4 characters" });
  }

  try {
    const trimmedSearchTerm = searchTerm.trim();
    const result = await db.query(
      `
      SELECT 
        p.policy_id,
        p.policy_name,
        p.nickname,
        p.og_file_path,
        ARRAY_AGG(DISTINCT k.keyword) AS keywords,
        ARRAY_AGG(DISTINCT c.category) AS categories,
        ARRAY_AGG(DISTINCT pr.program) AS programs
      FROM policy p
      LEFT JOIN category c ON p.policy_id = c.policy_id
      LEFT JOIN keyword k ON p.policy_id = k.policy_id
      LEFT JOIN program pr ON p.policy_id = pr.policy_id
       WHERE 
        p.parent_policy_id IS NULL
        AND (
          p.policy_name ILIKE '%' || $1 || '%'
          OR p.nickname ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1 FROM keyword k2 
            WHERE k2.policy_id = p.policy_id AND k2.keyword = $1
          )
          OR EXISTS (
            SELECT 1 FROM category c2 
            WHERE c2.policy_id = p.policy_id AND c2.category = $1
          )
        )
      GROUP BY 
        p.policy_id, p.policy_name, p.nickname, p.effective_date, 
        p.expiration_date, p.og_file_path
      ORDER BY 
        p.policy_name ASC
      LIMIT $2 OFFSET $3;
      `,
      [trimmedSearchTerm, limit, offset]
    );

    // Count query for pagination
    const countResult = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM policy p
      WHERE 
        p.parent_policy_id IS NULL
        AND (
          p.policy_name ILIKE '%' || $1 || '%'
          OR p.nickname ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1 FROM keyword k2 
            WHERE k2.policy_id = p.policy_id AND k2.keyword = $1
          )
          OR EXISTS (
            SELECT 1 FROM category c2 
            WHERE c2.policy_id = p.policy_id AND c2.category = $1
          )
        );
      `,
      [trimmedSearchTerm]
    );

    const totalPolicies = parseInt(countResult.rows[0].total, 10);

    res.json({
      policies: result.rows,
      total: totalPolicies,
      hasNextPage: offset + parseInt(limit, 10) < totalPolicies,
    });
  } catch (error) {
    console.error("Error executing search query:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
