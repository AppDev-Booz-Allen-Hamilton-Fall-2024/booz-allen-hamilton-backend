const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = parseInt(req.query.offset, 10) || 0;

    // Query to get parent policies within the limit and offset
    const parentPoliciesQuery = `
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
      WHERE 
        p.parent_policy_id IS NULL
      GROUP BY 
        p.policy_id
      ORDER BY 
        p.policy_name ASC
      LIMIT $1 OFFSET $2
    `;
    const parentPolicies = await db.query(parentPoliciesQuery, [limit, offset]);

    // If no parent policies are found, return early
    if (parentPolicies.rows.length === 0) {
      return res.json({
        policies: [],
        totalPages: 0,
        hasNextPage: false,
      });
    }

    // Extract parent policy IDs
    const parentPolicyIds = parentPolicies.rows.map(
      (policy) => policy.policy_id
    );

    // Query to get all children of the fetched parent policies
    const childrenPoliciesQuery = `
      SELECT 
        p.policy_id, 
        p.policy_name, 
        p.effective_date, 
        p.expiration_date,
        p.og_file_path,
        p.parent_policy_id
      FROM 
        policy p
      WHERE 
        p.parent_policy_id = ANY($1::int[])
      ORDER BY 
        p.parent_policy_id ASC, p.effective_date ASC
    `;
    const childrenPolicies = await db.query(childrenPoliciesQuery, [
      parentPolicyIds,
    ]);

    // Group children by parent policy ID for easier mapping
    const childrenByParent = childrenPolicies.rows.reduce((acc, child) => {
      if (!acc[child.parent_policy_id]) acc[child.parent_policy_id] = [];
      acc[child.parent_policy_id].push(child);
      return acc;
    }, {});

    // Combine parent policies with their children
    const policiesWithChildren = parentPolicies.rows.map((parent) => ({
      ...parent,
      children: childrenByParent[parent.policy_id] || [],
    }));

    // Query to count total parent policies
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM policy
      WHERE parent_policy_id IS NULL
    `;
    const countResult = await db.query(countQuery);
    const totalParentPolicies = parseInt(countResult.rows[0].total, 10);

    // Pagination details
    const totalPages = Math.ceil(totalParentPolicies / limit);
    const hasNextPage = offset + limit < totalParentPolicies;

    // Response
    res.json({
      policies: policiesWithChildren,
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
