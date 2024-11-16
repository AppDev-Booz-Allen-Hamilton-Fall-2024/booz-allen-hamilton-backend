const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get('/file', (req, res) => {
  const { path } = req.query;
  const safePath = path.replace(/(\.\.(\/|\\|$))+/g, '');

  if (fs.existsSync(path)) {
    res.sendFile(path);
  } else {
    res.status(404).send('File not found');
  }
});

module.exports = router;
