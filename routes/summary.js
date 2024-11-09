const express = require('express');
const router = express.Router();
const db = require('../db'); 

// API to fetch policies
router.get('/:policyId/summary', async (req, res) => {
    const { policyId } = req.params;
  
    try {
      const result = await db.query(
        'SELECT summary FROM policy WHERE policy_id = $1',
        [policyId]
      );
      res.json(result.rows.map(row => row.keyword));
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).send('Error fetching summary');
    }
  });
  
  module.exports = router;