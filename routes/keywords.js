const express = require('express');
const router = express.Router();
const db = require('../db'); 

// GET route to fetch keywords for a specific policy
router.get('/:policyId/keywords', async (req, res) => {
  const { policyId } = req.params;

  try {
    const result = await db.query(
      'SELECT keyword FROM keyword WHERE policy_id = $1',
      [policyId]
    );
    res.json(result.rows.map(row => row.keyword));
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).send('Error fetching keywords');
  }
});

// POST route to add a new keyword
router.post('/:policyId/keywords', async (req, res) => {
  const { policyId } = req.params;
  const { keyword } = req.body;

  try {
    await db.query(
      'INSERT INTO keyword (policy_id, keyword) VALUES ($1, $2)',
      [policyId, keyword]
    );
    res.status(201).send('Keyword added');
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).send('Error adding keyword');
  }
});

// DELETE route to delete a keyword
router.delete('/:policyId/keywords', async (req, res) => {
  const { policyId } = req.params;
  const { keyword } = req.body;

  try {
    await db.query(
      'DELETE FROM keyword WHERE policy_id = $1 AND keyword = $2',
      [policyId, keyword]
    );
    res.status(200).send('Keyword deleted');
  } catch (error) {
    console.error('Error deleting keyword:', error);
    res.status(500).send('Error deleting keyword');
  }
});

module.exports = router;
