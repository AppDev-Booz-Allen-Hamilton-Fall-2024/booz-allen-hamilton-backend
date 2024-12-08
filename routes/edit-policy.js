const express = require("express");
const router = express.Router();
const db = require("../db");

// Function to validate date format
function isValidDate(date) {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

// Consolidated route to update policy details
router.put("/edit-policy/:policy_id", async (req, res) => {
  console.log("entered");
  const { policy_id } = req.params;
  const { effective_date, expiration_date, nickname, categories, programs } =
    req.body;
  console.log(effective_date);
  console.log(nickname);

  try {
    // Validate date formats
    if (effective_date && !isValidDate(effective_date)) {
      return res
        .status(400)
        .json({ error: "Invalid format for effective_date. Use YYYY-MM-DD." });
    }
    if (expiration_date && !isValidDate(expiration_date)) {
      return res
        .status(400)
        .json({ error: "Invalid format for expiration_date. Use YYYY-MM-DD." });
    }

    // Start transaction
    await db.query("BEGIN");

    // Update policy details (effective_date, expiration_date, nickname)
    const policyUpdateQuery = `
      UPDATE policy
      SET 
        effective_date = COALESCE($2, effective_date),
        expiration_date = COALESCE($3, expiration_date),
        nickname = COALESCE($4, nickname),
        updated_when = NOW()
      WHERE policy_id = $1
      RETURNING *;
    `;
    const policyUpdateValues = [
      policy_id,
      effective_date || null,
      expiration_date || null,
      nickname || null,
    ];

    const policyUpdateResult = await db.query(
      policyUpdateQuery,
      policyUpdateValues
    );

    if (policyUpdateResult.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Policy not found" });
    }

    // Update categories
    if (categories) {
      const categoryList = categories
        .split(",")
        .map((cat) => cat.trim())
        .filter((cat) => cat);

      await db.query("DELETE FROM category WHERE policy_id = $1", [policy_id]);
      const insertCategoryQuery = `INSERT INTO category (policy_id, category) VALUES ($1, $2)`;
      for (const category of categoryList) {
        await db.query(insertCategoryQuery, [policy_id, category]);
      }
    }

    if (programs) {
      const programList = programs
        .split(",")
        .map((prog) => prog.trim())
        .filter((prog) => prog);

      await db.query("DELETE FROM program WHERE policy_id = $1", [policy_id]);
      const insertProgramQuery = `INSERT INTO program (policy_id, program) VALUES ($1, $2)`;
      for (const program of programList) {
        await db.query(insertProgramQuery, [policy_id, program]);
      }
    }

    await db.query("COMMIT");

    res.status(200).json({
      message: "Policy updated successfully",
      policy: policyUpdateResult.rows[0],
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    console.error("Error updating policy:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/edit-policy-name/:policy_id", async (req, res) => {
  console.log("editing nickname");
  const { policy_id } = req.params;
  const { policy_name } = req.body;

  try {
    if (!policy_name) {
      return res
        .status(400)
        .json({ error: "Please provide a policy_name to update." });
    }

    const query = `
            UPDATE policy
            SET nickname = $2, updated_when = NOW()
            WHERE policy_id = $1
            RETURNING *;
        `;

    const result = await db.query(query, [policy_id, policy_name]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).send("nickname updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
