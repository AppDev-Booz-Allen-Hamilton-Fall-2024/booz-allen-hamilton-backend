const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get("/file", (req, res) => {
  const absolutepath = req.query.path;
  res.sendFile(absolutepath);
});

module.exports = router;
