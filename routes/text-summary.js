const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:parent_id/:policy_id/text-summary", async (req, res) => {
  const { parent_id, policy_id } = req.params;
  console.log(parent_id);
  console.log(policy_id);

  try {
    // Check if both policies exist in the database
    const policyCheckQuery = `
      SELECT policy_id
      FROM policy
      WHERE policy_id = $1 OR policy_id = $2
    `;
    const policyCheckResult = await db.query(policyCheckQuery, [
      parent_id,
      policy_id,
    ]);

    if (policyCheckResult.rows.length !== 2) {
      return res.status(404).json({ error: "One or both policies not found." });
    }

    // Fetch the text difference from the summary_diff table
    const diffQuery = `
      SELECT summary_difference
      FROM summary_diff
      WHERE (policy_id_1 = $1 AND policy_id_2 = $2)
         OR (policy_id_1 = $2 AND policy_id_2 = $1)
    `;
    const diffResult = await db.query(diffQuery, [parent_id, policy_id]);

    if (diffResult.rows.length === 0) {
      return res.status(404).json({ error: "Summary difference not found." });
    }

    // Return the summary difference
    res.status(200).json({
      parent_id,
      policy_id,
      summary_difference: diffResult.rows[0].summary_difference,
    });
  } catch (error) {
    console.error("Error fetching text summary difference:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
