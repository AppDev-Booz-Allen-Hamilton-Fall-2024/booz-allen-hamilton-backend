const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");
const fs = require("fs");
const router = express.Router();
const AdmZip = require("adm-zip");
const { json } = require("body-parser");
const fileUpload = require("express-fileupload");

router.post("/upload-policy-zip", async (req, res) => {
  const file = req.files.zipFile;
  const zipPath = path.join(__dirname, "uploads", file.name);
  const extractedDir = "/Users/rohan/booz_allen/booz-allen-hamilton-backend/policies/TX"


  await file.mv(zipPath);

  console.log("BEFORE")
  try {
    const zip = new AdmZip(zipPath);
    const newPdfFiles = [];
    zip.getEntries().forEach((entry) => {
      if (
        !entry.entryName.startsWith("__MACOSX") &&
        !entry.isDirectory &&                      
        entry.entryName !== "texas.zip" &&        
        entry.entryName.endsWith(".pdf")        
      ) {
        zip.extractEntryTo(entry, extractedDir, false, false);
        newPdfFiles.push(entry.entryName);
      }
    });
    

    const pdfFiles = newPdfFiles;
    console.log('PDF files extracted:', pdfFiles);
    const policyIds = [];

    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(extractedDir, pdfFile);
        console.log('Inserting PDF path:', pdfPath);
        const result = await db.query(
            'INSERT INTO policy (og_file_path) VALUES ($1) RETURNING policy_id',
            [pdfPath]
        );
        policyIds.push(result.rows[0].policy_id);
    }

    res.status(200).json({ message: 'Upload successful', policyIds });
    console.log('Policy IDs:', policyIds);

    // Run the Python script in the background to populate data
    const pythonScriptPath = path.join(__dirname, '..', 'populate_policy_data.py');
    console.log(pythonScriptPath);

    const pythonProcess = spawn('python3', [
        pythonScriptPath,
        JSON.stringify(policyIds),
    ]);

    pythonProcess.on('error', (error) => {
        console.error('Error in policy data population:', error);
    });

    pythonProcess.on('close', (code) => {
        console.error(`Policy data population process exited with code ${code}`);
        
    });

} catch (error) {
    console.error('Error during processing:', error);
    res.status(500).json({ message: 'Upload failed' });
} finally {
    // Clean up the temporary ZIP file and extracted directory
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }
}
});

module.exports = router;
