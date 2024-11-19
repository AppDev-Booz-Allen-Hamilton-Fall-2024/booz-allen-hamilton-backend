const express = require("express");
const router = express.Router();
const db = require("../db"); // Ensure this points to your database connection setup

// Updated filter policies function
const filterPolicies = async (req, res) => {
  const { state, category, effectiveDate, expirationDate } = req.query;

  const filters = [];
  const values = [];
  let paramIndex = 1; // Counter for placeholders

  if (state) {
    filters.push(`state_name = $${paramIndex++}`);
    values.push(state);
  }

  if (category) {
    filters.push(`categories = $${paramIndex++}`);
    values.push(category);
  }

  if (effectiveDate) {
    filters.push(`TO_CHAR(effective_date, 'YYYY-MM-DD') = $${paramIndex++}`);
    values.push(effectiveDate);
  }

  if (expirationDate) {
    filters.push(`TO_CHAR(expiration_date, 'YYYY-MM-DD') = $${paramIndex++}`);
    values.push(expirationDate);
  }

  // Construct the SQL query
  const query = `
    SELECT * FROM policy
    ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
  `;

  try {
    console.log("Constructed query:", query, values);
    const result = await db.query(query, values);
    console.log("Query result:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error filtering policies:", error);
    res.status(500).send("Error querying the database");
  }
};

// Route definition
router.get("/", filterPolicies);

module.exports = router;
