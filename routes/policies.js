const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = parseInt(req.query.offset, 10) || 0;

    const policiesQuery = `
      SELECT 
        p.policy_id, 
        p.policy_name, 
        p.effective_date, 
        p.expiration_date,
        p.og_file_path,
        STRING_AGG(c.category, ', ') AS categories 
      FROM 
        policy p
      LEFT JOIN 
        category c ON p.policy_id = c.policy_id
      GROUP BY 
        p.policy_id
      ORDER BY 
        p.policy_name ASC
      LIMIT $1 OFFSET $2
    `;
    const policies = await db.query(policiesQuery, [limit, offset]);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM policy
    `;
    const countResult = await db.query(countQuery);
    const totalPolicies = parseInt(countResult.rows[0].total, 10);

    const totalPages = Math.ceil(totalPolicies / limit);
    const hasNextPage = offset + limit < totalPolicies;

    res.json({
      policies: policies.rows,
      totalPages: totalPages,
      hasNextPage,
    });
  } catch (error) {
    console.error("Database error: ", error);
    res
      .status(500)
      .json({ message: "Error fetching policies", error: error.message });
  }
});

module.exports = router;