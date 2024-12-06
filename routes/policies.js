const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = parseInt(req.query.offset, 10) || 0;

    const policiesQuery = `
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
      GROUP BY 
        p.policy_id
      ORDER BY 
        p.policy_name ASC
      LIMIT $1 OFFSET $2
    `;
    const policies = await db.query(policiesQuery, [limit, offset]);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM policy
    `;
    const countResult = await db.query(countQuery);
    const totalPolicies = parseInt(countResult.rows[0].total, 10);

    const totalPages = Math.ceil(totalPolicies / limit);
    const hasNextPage = offset + limit < totalPolicies;

    res.json({
      policies: policies.rows,
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

router.get(`/:policyId/get`, async (req, res) => {
  try {
    const { policyId } = req.params;
    console.log((Number(policyId)))
    
    const result = await db.query("SELECT policy_name, effective_date, og_file_path FROM policy WHERE policy_id = $1",
      [policyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ name: result.rows[0].policy_name, date: result.rows[0].effective_date, filePath: result.rows[0].og_file_path });
  } catch (error) {
    console.error("Database error: ", error);
    res
      .status(500)
      .json({ message: "Error fetching policies", error: error.message });
  }

})

router.get(`/:policyId/children`, async (req, res) => {
  try {
    const { policyId } = req.params;
    console.log((Number(policyId)))
    
    const result = await db.query("SELECT policy_name, nickname, effective_date, og_file_path, annotations, policy_id FROM policy WHERE parent_policy_id = $1",
      [policyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    console.log(result.rows[0])


    versions = result.rows.map((row) => {
      return {name: row.policy_name, nickname: row.nickname, date: row.effective_date, filePath: row.og_file_path, annotations: row.annotations, policyId: row.policy_id};
    })

    versions.sort((a, b) => {
      return a.nickname.localeCompare(b.nickname);
    })

    const r = await db.query("SELECT policy_name, nickname, effective_date, og_file_path, annotations, policy_id FROM policy WHERE policy_id = $1",[policyId]);

    versions.push({ name: r.rows[0].policy_name, nickname: r.rows[0].nickname, date: r.rows[0].effective_date, filePath: r.rows[0].og_file_path, annotations: r.rows[0].annotations, policyId: r.rows[0].policy_id })

    res.json(versions);
  } catch (error) {
    console.error("Database error: ", error);
    res
      .status(500)
      .json({ message: "Error fetching policy versions", error: error.message });
  }

})

router.post("/:policyId/annotate/:annotations", async(req, res) => {
  try {
    const {policyId, annotations} = req.params;
    const result = db.query(
      'UPDATE policy SET annotations = $2 WHERE policy_id = $1',
      [policyId, annotations]
    )
  } catch (error) {
    console.error("Database error: ", error);
    res
      .status(500)
      .json({ message: "Error storing policy annotations", error: error.message });
  }
})

module.exports = router;