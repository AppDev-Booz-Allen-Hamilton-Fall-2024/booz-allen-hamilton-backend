const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/search-filter", async (req, res) => {
  const {
    selectedState,
    selectedCategory,
    selectedEffectiveDate,
    selectedExpirationDate,
    searchTerm,
  } = req.query;

  console.log(searchTerm);
  console.log(selectedCategory);

  const filters = [];
  const values = [];
  let paramIndex = 1;

  // Partial match for nickname and policy_name or exact match for keywords
  if (searchTerm) {
    const sanitizedSearchTerm = searchTerm.replace(/\\/g, "\\\\");
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

  // State filter
  if (selectedState) {
    filters.push(`p.state_name = $${paramIndex}`);
    values.push(selectedState);
    paramIndex++;
  }

  // Effective date filter
  if (selectedEffectiveDate) {
    filters.push(`p.effective_date >= $${paramIndex}`);
    values.push(selectedEffectiveDate);
    paramIndex++;
  }

  // Expiration date filter
  if (selectedExpirationDate) {
    filters.push(`p.expiration_date <= $${paramIndex}`);
    values.push(selectedExpirationDate);
    paramIndex++;
  }

  // Exact match for category
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

  const query = `
      WITH matching_policies AS (
        SELECT
          p.policy_id,
          COALESCE(p.parent_policy_id, p.policy_id) AS root_policy_id
        FROM policy p
        ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
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
        JOIN policy parent ON parent.policy_id = mp.root_policy_id
        LEFT JOIN policy child ON child.parent_policy_id = parent.policy_id
      )
      SELECT DISTINCT *
      FROM policies_with_children
      ORDER BY parent_id, child_id NULLS LAST
      LIMIT 50;
    `;

  try {
    const result = await db.query(query, values);

    console.log("searching through shit");
    const policiesMap = new Map();

    result.rows.forEach((row) => {
      const parentId = row.parent_id;

      // If the parent policy is not already in the map, initialize it
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
              version: "Recent", // Parent is always the "Recent" version
            },
          ],
        });
      }

      // If a child policy exists, add it to the versions array
      if (row.child_id) {
        policiesMap.get(parentId).versions.push({
          policy_id: row.child_id,
          policy_name: row.child_name,
          nickname: row.child_nickname,
          effective_date: row.child_effective_date,
          expiration_date: row.child_expiration_date,
          state_name: row.child_state,
          version: row.child_name, // Child policies are "Previous" versions
        });
      }
    });

    const policies = Array.from(policiesMap.values());
    res.json({ policies });
  } catch (error) {
    console.error("Error fetching policies:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching policies." });
  }
});

module.exports = router;
