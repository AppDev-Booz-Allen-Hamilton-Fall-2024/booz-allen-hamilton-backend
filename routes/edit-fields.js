const express = require("express");
const router = express.Router();
const db = require("../db");

// function to validate date format
function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

// Update the effective_date
router.put("/edit-effective-date/:policy_id", async (req, res) => {
  console.log("editing effective date");
  const { policy_id } = req.params;
  const { effective_date } = req.body;

  try {
    //check for formatting
    if (!effective_date || !isValidDate(effective_date)) {
      return res
        .status(400)
        .json({ error: "Invalid format for effective_date. Use YYYY-MM-DD." });
    }

    // update effective_date
    const query = `
            UPDATE policy
            SET effective_date = $2, 
                updated_when = NOW() --update 'updated_when'
            WHERE policy_id = $1
            RETURNING *;
        `;

    const result = await db.query(query, [policy_id, effective_date]);

    // make sure policy was updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).send("effective date updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update the expiration_date
router.put("/edit-expiration-date/:policy_id", async (req, res) => {
  console.log("editing-expiration-date");
  const { policy_id } = req.params;
  const { expiration_date } = req.body;

  try {
    //check for formatting
    if (!expiration_date || !isValidDate(effective_date)) {
      return res
        .status(400)
        .json({ error: "Invalid format for expiration_date. Use YYYY-MM-DD." });
    }

    const query = `
            UPDATE policy
            SET expiration_date = $2, 
                updated_when = NOW()
            WHERE policy_id = $1
            RETURNING *;
        `;

    const result = await db.query(query, [policy_id, expiration_date]);

    // make sure policy was updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).send("expiration date updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Nickname
router.put("/edit-policy-name/:policy_id", async (req, res) => {
  console.log("editing nickname");
  const { policy_id } = req.params;
  const { policy_name } = req.body;

  try {
    if (!policy_name) {
      return res
        .status(400)
        .json({ error: "Please provide a policy_name to update." });
    }

    const query = `
            UPDATE policy
            SET nickname = $2, updated_when = NOW()
            WHERE policy_id = $1
            RETURNING *;
        `;

    const result = await db.query(query, [policy_id, policy_name]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).send("nickname updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update categories
router.put("/edit-categories/:policy_id", async (req, res) => {
  console.log("editing categories");
  const { policy_id } = req.params;
  const { categories } = req.body;

  if (!categories || typeof categories !== "string") {
    return res
      .status(400)
      .json({ error: "Please provide a comma-separated categories string." });
  }

  // Split the categories string into an array of individual categories
  const categoryList = categories.split(",").map((cat) => cat.trim());

  try {
    await db.query("BEGIN");

    // Delete existing categories for this policy
    await db.query("DELETE FROM category WHERE policy_id = $1", [policy_id]);

    // Insert each new category for the policy
    const insertQuery = `
            INSERT INTO category (policy_id, category)
            VALUES ($1, $2)
        `;

    for (const category of categoryList) {
      await db.query(insertQuery, [policy_id, category]);
    }

    await db.query("COMMIT");

    res.status(200).json({ message: "Categories updated successfully" });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    console.error("Error updating categories:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/edit-program/:policy_id", async (req, res) => {
  console.log("editing program");
  const { policy_id } = req.params;
  const { program } = req.body;

  if (!program || typeof program !== "string") {
    return res
      .status(400)
      .json({ error: "Please provide a comma-separated categories string." });
  }

  try {
    if (!policy_name) {
      return res
        .status(400)
        .json({ error: "Please provide a policy_name to update." });
    }

    const query = `
                UPDATE policy
                SET program = $2, updated_when = NOW()
                WHERE policy_id = $1
                RETURNING *;
            `;

    const result = await db.query(query, [policy_id, program]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).json({ message: "Categories updated successfully" });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    console.error("Error updating categories:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
