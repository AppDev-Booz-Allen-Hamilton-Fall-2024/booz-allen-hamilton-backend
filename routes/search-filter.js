
/**
 * Route: GET /search-filter
 * Purpose: Filters policies (parent and child) based on multiple criteria provided in the query parameters.
 * - Criteria include state, category, effective/expiration dates, and search terms.
 */




const express = require("express");
const router = express.Router();
const db = require("../db");


router.get("/search-filter", async (req, res) => {
  /**
   * Step 1: Extract query parameters from the request.
   * - `selectedState`, `selectedCategory`, `selectedEffectiveDate`, and `selectedExpirationDate` 
   *   represent specific filtering criteria provided by the user.
   * - `searchTerm` allows for searching by policy names, nicknames, or associated keywords.
   */
  const {
    selectedState,
    selectedCategory,
    selectedEffectiveDate,
    selectedExpirationDate,
    searchTerm,
  } = req.query;

  // Arrays to build dynamic SQL filters and parameterized query values.
  const filters = [];
  const values = [];
  let paramIndex = 1; // Index for parameter placeholders in the SQL query.

  /**
   * Step 2: Add filters based on the provided criteria.
   * - For each parameter, a corresponding SQL condition is added to the `filters` array.
   * - The `values` array holds the sanitized values to avoid SQL injection.
   */

  // Filter for partial matches in policy_name or nickname, or exact matches in keywords.
  if (searchTerm) {
    const sanitizedSearchTerm = searchTerm.replace(/\\/g, "\\\\"); // Ensure safe input for SQL.
    filters.push(`(
        p.policy_name ILIKE '%' || $${paramIndex} || '%'
        OR p.nickname ILIKE '%' || $${paramIndex} || '%'
        OR EXISTS (
          SELECT 1
          FROM keyword k
          WHERE k.policy_id = p.policy_id AND k.keyword = $${paramIndex}
        )
      )`);
    values.push(sanitizedSearchTerm);
    paramIndex++;
  }

  // Filter for exact state matches if `selectedState` is provided.
  if (selectedState) {
    filters.push(`p.state_name = $${paramIndex}`);
    values.push(selectedState);
    paramIndex++;
  }

  // Filter for policies with effective dates greater than or equal to `selectedEffectiveDate`.
  if (selectedEffectiveDate) {
    filters.push(`p.effective_date >= $${paramIndex}`);
    values.push(selectedEffectiveDate);
    paramIndex++;
  }

  // Filter for policies with expiration dates less than or equal to `selectedExpirationDate`.
  if (selectedExpirationDate) {
    filters.push(`p.expiration_date <= $${paramIndex}`);
    values.push(selectedExpirationDate);
    paramIndex++;
  }

  // Filter for exact category matches using a subquery.
  if (selectedCategory) {
    filters.push(`
        EXISTS (
          SELECT 1
          FROM category c
          WHERE c.policy_id = p.policy_id AND c.category = $${paramIndex}
        )
      `);
    values.push(selectedCategory);
    paramIndex++;
  }

  /**
   * Step 3: Construct the SQL query.
   * - This query uses two Common Table Expressions (CTEs):
   *   1. `matching_policies`: Applies the filters to find matching parent policies.
   *   2. `policies_with_children`: Combines parent policies with their child versions.
   * - The final query fetches distinct results and limits them to 50 for performance reasons.
   */
  const query = `
      WITH matching_policies AS (
        SELECT
          p.policy_id,
          COALESCE(p.parent_policy_id, p.policy_id) AS root_policy_id
        FROM policy p
        ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""} -- Apply dynamic filters.
      ),
      policies_with_children AS (
        SELECT
          parent.policy_id AS parent_id,
          parent.policy_name AS parent_name,
          parent.nickname AS parent_nickname,
          parent.effective_date AS parent_effective_date,
          parent.expiration_date AS parent_expiration_date,
          parent.state_name AS parent_state,
          child.policy_id AS child_id,
          child.policy_name AS child_name,
          child.nickname AS child_nickname,
          child.effective_date AS child_effective_date,
          child.expiration_date AS child_expiration_date,
          child.state_name AS child_state
        FROM matching_policies mp
        JOIN policy parent ON parent.policy_id = mp.root_policy_id -- Link parent policies.
        LEFT JOIN policy child ON child.parent_policy_id = parent.policy_id -- Include child policies if they exist.
      )
      SELECT DISTINCT * -- Remove duplicates.
      FROM policies_with_children
      ORDER BY parent_id, child_id NULLS LAST -- Sort by parent and child IDs.
      LIMIT 50; -- Fetch only the top 50 results.
    `;

  /**
   * Step 4: Execute the SQL query and process the results.
   * - Execute the query using the parameterized values to ensure safety.
   * - Organize the resulting policies into a structured format where parent policies
   *   include their child versions as a nested array.
   */
  try {
    const result = await db.query(query, values);

    // Create a map to group policies by parent ID for efficient organization.
    const policiesMap = new Map();

    result.rows.forEach((row) => {
      const parentId = row.parent_id;

      // If the parent policy is not already in the map, initialize it.
      if (!policiesMap.has(parentId)) {
        policiesMap.set(parentId, {
          policy_id: parentId,
          policy_name: row.parent_name,
          nickname: row.parent_nickname,
          effective_date: row.parent_effective_date,
          expiration_date: row.parent_expiration_date,
          state_name: row.parent_state,
          versions: [
            {
              policy_id: parentId,
              policy_name: row.parent_name,
              nickname: row.parent_nickname,
              effective_date: row.parent_effective_date,
              expiration_date: row.parent_expiration_date,
              state_name: row.parent_state,
              version: "Recent", // Mark the parent policy as the most recent version.
            },
          ],
        });
      }

      // Add child policies to the parent's `versions` array if they exist.
      if (row.child_id) {
        policiesMap.get(parentId).versions.push({
          policy_id: row.child_id,
          policy_name: row.child_name,
          nickname: row.child_nickname,
          effective_date: row.child_effective_date,
          expiration_date: row.child_expiration_date,
          state_name: row.child_state,
          version: row.child_name, // Treat child policies as earlier versions.
        });
      }
    });

    // Convert the map of policies to an array for the JSON response.
    const policies = Array.from(policiesMap.values());
    res.json({ policies });
  } catch (error) {
    /**
     * Step 5: Handle errors during query execution or result processing.
     * - Log the error for debugging purposes.
     * - Respond with a 500 status code and a generic error message to the client.
     */
    console.error("Error fetching policies:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching policies." });
  }
});

module.exports = router;
