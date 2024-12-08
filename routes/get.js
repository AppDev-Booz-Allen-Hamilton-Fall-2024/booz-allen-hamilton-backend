const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:policyId/get", async (req, res) => {
  const { policyId } = req.params;

  const numericPolicyId = parseInt(policyId, 10);
  if (isNaN(numericPolicyId)) {
    return res.status(400).json({ error: "Invalid policyId parameter" });
  }

  try {
    const policyQuery = `
      SELECT
        p.policy_id,
        p.policy_name,
        p.og_file_path,
        p.parent_policy_id,
        p.annotations
      FROM policy p
      WHERE p.policy_id = $1
    `;

    const policyResult = await db.query(policyQuery, [numericPolicyId]);

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    const policy = policyResult.rows[0];

    return res.json({
      policyId: policy.policy_id,
      name: policy.policy_name,
      filePath: policy.og_file_path,
      parentId: policy.parent_policy_id,
    });
  } catch (error) {
    console.error("Error fetching policy:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the policy." });
  }
});

module.exports = router;
