const express = require('express');
const router = express.Router();
const db = require('../db'); 

// API to fetch policies
router.get('/', async (req, res) => {
    try {
      const policies = await db.query(`
        SELECT 
          p.policy_id, 
          p.policy_name, 
          p.effective_date, 
          p.expiration_date, 
          STRING_AGG(c.category, ', ') AS categories 
        FROM 
          policy p
        LEFT JOIN 
          category c ON p.policy_id = c.policy_id
        GROUP BY 
          p.policy_id
      `);
      res.json(policies.rows);
    } catch (error) {
      console.error("Database error: ", error);
      res.status(500).json({ message: 'Error fetching policies', error: error.message });
    }
  });
  
  module.exports = router;