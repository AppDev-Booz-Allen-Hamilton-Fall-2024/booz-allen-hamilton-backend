const express = require("express");
const router = express.Router();
const db = require("../db");

const generateTextDifference = (file1, file2, policy_id_one, policy_id_two) => {
  const pythonScriptPath = path.join(__dirname, "..", "text_diff.py");
  const pythonProcess = spawn("python", [pythonProcess, file1, file2]);

  let output = "";
  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Error from text_diff script:", data.toString());
  });

  pythonProcess.on("close", async (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      return;
    }

    try {
      const parentId = policy_id_two; // Parent policy
      const childId = policy_id_one; // Child policy

      await db.query(
        `INSERT INTO summary_diff (policy_id_1, policy_id_2, summary_difference, created_when)
   VALUES ($1, $2, $3, NOW())`,
        [parentId, childId, output.trim()]
      );
      console.log(
        `Summary difference generated and saved for policies ${policy_id_one} and ${policy_id_two}`
      );
    } catch (error) {
      console.error(
        "Error saving summary difference to database:",
        error.message
      );
    }
  });
};

router.post("/:policy_id_one/:policy_id_two/move-policy", async (req, res) => {
  const policy_id_one = req.params.policy_id_one;
  const policy_id_two = req.params.policy_id_two;
  console.log(policy_id_one);
  console.log(policy_id_two);

  try {
    await db.query("BEGIN");

    const [policyOne, policyTwo] = await Promise.all([
      db.query(
        "SELECT policy_id, parent_policy_id, og_file_path FROM policy WHERE policy_id = $1",
        [policy_id_one]
      ),
      db.query(
        "SELECT policy_id, og_file_path FROM policy WHERE policy_id = $1",
        [policy_id_two]
      ),
    ]);

    if (policyOne.rowCount === 0 || policyTwo.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Policy not found." });
    }

    const parentPolicy = policyTwo.rows[0];
    const childPolicy = policyOne.rows[0];

    console.log("check done");
    if (childPolicy.parent_policy_id !== null) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        error: `Policy ID ${policy_id_one} is already a version of another policy.`,
      });
    }

    // Update policy_id_one to set its parent_policy_id to policy_id_two
    await db.query(
      `
      UPDATE policy
      SET parent_policy_id = $1
      WHERE policy_id = $2
      `,
      [policy_id_two, policy_id_one]
    );

    await db.query("COMMIT");

    res.status(200).json({
      message: `Policy ID ${policy_id_one} successfully set as a version of Policy ID ${policy_id_two}.`,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error occurred during move-policy:", error.message);
    res
      .status(500)
      .json({ error: "Failed to move policy due to server error." });
  }
});

module.exports = router;
