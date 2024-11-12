const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await db.query(
      `
      SELECT p.policy_id, p.policy_name, p.effective_date, p.expiration_date, p.summary,
             array_agg(DISTINCT k.keyword) AS keywords,
             array_agg(DISTINCT c.category) AS categories
      FROM policy p
      LEFT JOIN keyword k ON p.policy_id = k.policy_id
      LEFT JOIN category c ON p.policy_id = c.policy_id
      WHERE to_tsvector('english', p.policy_name) @@ plainto_tsquery('english', $1)
         OR to_tsvector('english', k.keyword) @@ plainto_tsquery('english', $1)
         OR to_tsvector('english', c.category) @@ plainto_tsquery('english', $1)
      GROUP BY p.policy_id
      `,
      [query]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;