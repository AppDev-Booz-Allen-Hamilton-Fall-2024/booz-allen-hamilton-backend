const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");
const fs = require("fs");
const router = express.Router();

router.post("/upload-policy-zip", async (req, res) => {
  const file = req.files.zipFile;
  const zipPath = path.join(__dirname, "uploads", file.name);

  // Save the ZIP file temporarily
  await file.mv(zipPath);

  // Call the Python script to process the ZIP file
  const pythonProcess = spawn("python", ["insert_policies.py", zipPath]);

  pythonProcess.stdout.on("data", (data) => {
    const policyIds = JSON.parse(data.toString()); // Expecting JSON with policy IDs
    res.status(200).json({ message: "Upload successful", policyIds });
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on("error", (error) => {
    console.error("Error during processing:", error);
    res.status(500).json({ message: "Upload failed" });
  });
});
