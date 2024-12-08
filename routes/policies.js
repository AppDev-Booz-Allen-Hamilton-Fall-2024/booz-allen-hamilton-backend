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
    filters.push(`EXISTS (
          SELECT 1
          FROM category c
          WHERE c.policy_id = p.policy_id AND c.category = $${paramIndex}
        )`);
    values.push(selectedCategory);
    paramIndex++;
  }

  console.log("filters");
  console.log(filters);

  const parentPoliciesQuery = `
  SELECT 
    p.policy_id, 
    p.policy_name, 
    p.nickname,
    p.effective_date, 
    p.expiration_date,
    p.og_file_path,
    ARRAY_AGG(DISTINCT c.category) AS categories,
    ARRAY_AGG(DISTINCT pr.program) AS programs
  FROM 
    policy p
  LEFT JOIN 
    category c ON p.policy_id = c.policy_id
  LEFT JOIN
    program pr ON p.policy_id = pr.policy_id
  ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
  ${filters.length > 0 ? "AND" : filters.length === 0 ? "WHERE" : ""}
  p.parent_policy_id IS NULL
  GROUP BY 
    p.policy_id
  ORDER BY 
    p.nickname ASC, p.policy_name ASC
  LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
`;

  values.push(limit, offset);

  try {
    const parentPolicies = await db.query(parentPoliciesQuery, values);

    if (parentPolicies.rows.length === 0) {
      return res.json({
        policies: [],
        totalPages: 0,
        hasNextPage: false,
      });
    }

    const parentPolicyIds = parentPolicies.rows.map(
      (policy) => policy.policy_id
    );

    const childrenPoliciesQuery = `
      SELECT 
        p.policy_id, 
        p.policy_name, 
        p.effective_date, 
        p.expiration_date,
        p.og_file_path,
        p.parent_policy_id,
        ARRAY_AGG(DISTINCT c.category) AS categories,
        ARRAY_AGG(DISTINCT pr.program) AS programs
      FROM 
        policy p
      LEFT JOIN 
        category c ON p.policy_id = c.policy_id
      LEFT JOIN
        program pr ON p.policy_id = pr.policy_id
      WHERE 
        p.parent_policy_id = ANY($1::int[])
      GROUP BY 
        p.policy_id, p.parent_policy_id
      ORDER BY 
        p.parent_policy_id ASC, p.effective_date ASC
    `;

    const childrenPolicies = await db.query(childrenPoliciesQuery, [
      parentPolicyIds,
    ]);

    const childrenByParent = childrenPolicies.rows.reduce((acc, child) => {
      if (!acc[child.parent_policy_id]) acc[child.parent_policy_id] = [];
      acc[child.parent_policy_id].push(child);
      return acc;
    }, {});

    const policiesWithChildren = parentPolicies.rows.map((parent) => ({
      ...parent,
      children: childrenByParent[parent.policy_id] || [],
    }));

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM policy p
      ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
      ${filters.length > 0 ? "AND" : filters.length === 0 ? "WHERE" : ""}
      p.parent_policy_id IS NULL
    `;

    const countResult = await db.query(countQuery, values.slice(0, -2));
    const totalParentPolicies = parseInt(countResult.rows[0].total, 10);

    const totalPages = Math.ceil(totalParentPolicies / limit);
    const hasNextPage = offset + limit < totalParentPolicies;

    res.json({
      policies: policiesWithChildren,
      totalPages: totalPages,
      hasNextPage,
    });
  } catch (error) {
    console.error("Database error: ", error);
    res.status(500).json({
      message: "Error fetching policies",
      error: error.message,
    });
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
