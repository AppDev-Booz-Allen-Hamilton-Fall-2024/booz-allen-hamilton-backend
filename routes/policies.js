const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  const {
    selectedState,
    selectedCategory,
    selectedEffectiveDate,
    selectedExpirationDate,
    searchTerm,
    limit = 15,
    offset = 0,
  } = req.query;

  const filters = [];
  const values = [];
  let paramIndex = 1;

  // Apply filters dynamically
  if (searchTerm) {
    filters.push(`(
      p.policy_name ILIKE '%' || $${paramIndex} || '%'
      OR p.nickname ILIKE '%' || $${paramIndex} || '%'
      OR EXISTS (
        SELECT 1
        FROM category c
        WHERE c.policy_id = p.policy_id
        AND c.category ILIKE '%' || $${paramIndex} || '%'
      )
    )`);
    values.push(searchTerm); // Push searchTerm only once
    paramIndex++;
  }
  

  if (selectedState) {
    filters.push(`p.state_name = $${paramIndex}`);
    values.push(selectedState);
    paramIndex++;
  }

  if (selectedEffectiveDate) {
    filters.push(`p.effective_date::DATE = $${paramIndex}`);
    values.push(selectedEffectiveDate);
    paramIndex++;
  }

  if (selectedExpirationDate) {
    filters.push(`p.expiration_date::DATE = $${paramIndex}`);
    values.push(selectedExpirationDate);
    paramIndex++;
  }

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
        ARRAY_AGG(DISTINCT c.category) FILTER (WHERE c.category IS NOT NULL) AS parent_categories,
        ARRAY_AGG(DISTINCT pr.program) FILTER (WHERE pr.program IS NOT NULL) AS parent_programs,
        child.policy_id AS child_id,
        child.policy_name AS child_name,
        child.nickname AS child_nickname,
        child.effective_date AS child_effective_date,
        child.expiration_date AS child_expiration_date,
        ARRAY_AGG(DISTINCT cc.category) FILTER (WHERE cc.category IS NOT NULL) AS child_categories,
        ARRAY_AGG(DISTINCT cp.program) FILTER (WHERE cp.program IS NOT NULL) AS child_programs
      FROM matching_policies mp
      JOIN policy parent ON parent.policy_id = mp.root_policy_id
      LEFT JOIN policy child ON child.parent_policy_id = parent.policy_id
      LEFT JOIN category c ON parent.policy_id = c.policy_id
      LEFT JOIN program pr ON parent.policy_id = pr.policy_id
      LEFT JOIN category cc ON child.policy_id = cc.policy_id
      LEFT JOIN program cp ON child.policy_id = cp.policy_id
      GROUP BY parent.policy_id, child.policy_id
    )
    SELECT DISTINCT 
      parent_id, 
      parent_name, 
      parent_nickname, 
      parent_effective_date, 
      parent_expiration_date, 
      parent_categories, 
      parent_programs, 
      child_id, 
      child_name, 
      child_nickname, 
      child_effective_date, 
      child_expiration_date, 
      child_categories, 
      child_programs
    FROM policies_with_children
    ORDER BY parent_id, child_id NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  values.push(limit, offset);

  try {
    const result = await db.query(query, values);

    const policiesMap = new Map();

    // Group parent and child policies
    result.rows.forEach((row) => {
      if (!policiesMap.has(row.parent_id)) {
        policiesMap.set(row.parent_id, {
          policy_id: row.parent_id,
          policy_name: row.parent_name,
          nickname: row.parent_nickname,
          effective_date: row.parent_effective_date,
          expiration_date: row.parent_expiration_date,
          categories: row.parent_categories || [],
          programs: row.parent_programs || [],
          children: [],
        });
      }

      if (row.child_id) {
        policiesMap.get(row.parent_id).children.push({
          policy_id: row.child_id,
          policy_name: row.child_name,
          nickname: row.child_nickname,
          effective_date: row.child_effective_date,
          expiration_date: row.child_expiration_date,
          categories: row.child_categories || [],
          programs: row.child_programs || [],
        });
      }
    });

    const policies = Array.from(policiesMap.values());

    res.json({
      policies,
      totalPages: Math.ceil(policies.length / limit),
      hasNextPage: offset + limit < policies.length,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Error fetching policies", error });
  }
});

router.get(`/:policyId/get`, async (req, res) => {
  try {
    const { policyId } = req.params;
    console.log(Number(policyId));

    const result = await db.query(
      "SELECT policy_name, effective_date, og_file_path FROM policy WHERE policy_id = $1",
      [policyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json({
      name: result.rows[0].policy_name,
      date: result.rows[0].effective_date,
      filePath: result.rows[0].og_file_path,
    });
  } catch (error) {
    console.error("Database error: ", error);
    res
      .status(500)
      .json({ message: "Error fetching policies", error: error.message });
  }
});

router.get(`/:policyId/children`, async (req, res) => {
  try {
    const { policyId } = req.params;
    console.log(Number(policyId));

    const result = await db.query(
      "SELECT policy_name, nickname, effective_date, og_file_path, annotations, policy_id FROM policy WHERE parent_policy_id = $1",
      [policyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    console.log(result.rows[0]);

    versions = result.rows.map((row) => {
      return {
        name: row.policy_name,
        nickname: row.nickname,
        date: row.effective_date,
        filePath: row.og_file_path,
        annotations: row.annotations,
        policyId: row.policy_id,
      };
    });

    versions.sort((a, b) => {
      return a.nickname.localeCompare(b.nickname);
    });

    const r = await db.query(
      "SELECT policy_name, nickname, effective_date, og_file_path, annotations, policy_id FROM policy WHERE policy_id = $1",
      [policyId]
    );

    versions.push({
      name: r.rows[0].policy_name,
      nickname: r.rows[0].nickname,
      date: r.rows[0].effective_date,
      filePath: r.rows[0].og_file_path,
      annotations: r.rows[0].annotations,
      policyId: r.rows[0].policy_id,
    });

    res.json(versions);
  } catch (error) {
    console.error("Database error: ", error);
    res.status(500).json({
      message: "Error fetching policy versions",
      error: error.message,
    });
  }
});

router.post("/:policyId/annotate/:annotations", async (req, res) => {
  try {
    const { policyId, annotations } = req.params;
    const result = db.query(
      "UPDATE policy SET annotations = $2 WHERE policy_id = $1",
      [policyId, annotations]
    );
  } catch (error) {
    console.error("Database error: ", error);
    res.status(500).json({
      message: "Error storing policy annotations",
      error: error.message,
    });
  }
});

module.exports = router;
