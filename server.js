const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

require("./authentication")(app);

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

// Import routes
const policiesRoute = require("./routes/policies");
const keywordRoutes = require("./routes/keywords");
const summaryRoutes = require("./routes/summary");
const searchRoutes = require("./routes/search");
const fileRoutes = require("./routes/file");
const uploadPolicyRoutes = require("./routes/upload-policy");
const editFields = require('./routes/edid-fields');

// Use routes
app.use("/api/policies", policiesRoute);
app.use("/api/policies", keywordRoutes);
app.use("/api/policies", summaryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/policies", fileRoutes);
app.use("/api/", uploadPolicyRoutes);
app.use('/api', editFields); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
