/**
 * Backend Route: GET /:policyId/summary
 * Purpose: Retrieves the summary for a specific policy based on its ID.
 */

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:policyId/summary", async (req, res) => {
  /**
   * Step 1: Extract the `policyId` parameter from the request URL.
   * - `policyId` uniquely identifies the policy for which the summary is requested.
   */
  const { policyId } = req.params;

  try {
    /**
     * Step 2: Query the database to fetch the summary for the specified policy ID.
     * - The SQL query retrieves the `summary` field from the `policy` table.
     * - Uses a parameterized query (`$1`) to prevent SQL injection.
     */
    const result = await db.query(
      "SELECT summary FROM policy WHERE policy_id = $1",
      [policyId]
    );

    /**
     * Step 3: Check if the policy exists in the database.
     * - If no rows are returned, respond with a 404 status code indicating the policy was not found.
     */
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    /**
     * Step 4: Respond with the summary of the policy in JSON.
     */
    res.json({ summary: result.rows[0].summary });
  } catch (error) {
    /**
     * Step 5: Handling errors here
     */
    console.error("Error fetching summary:", error);
    res.status(500).send("Error fetching summary");
  }
});

module.exports = router;
