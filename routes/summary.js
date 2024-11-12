const express = require('express');
const router = express.Router();
const db = require('../db');

// GET route to fetch the summary for a specific policy
router.get('/:policyId/summary', async (req, res) => {
  const { policyId } = req.params;

  try {
    // Query to fetch the summary from the database
    const result = await db.query(
      'SELECT summary FROM policy WHERE policy_id = $1',
      [policyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ summary: result.rows[0].summary });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).send('Error fetching summary');
  }
});

module.exports = router;
