const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const fileUpload = require("express-fileupload");
require("dotenv").config({ path: "./backend/.env" });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: "your_session_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

require("./authentication")(app);

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

// Import routes
const policiesRoute = require("./routes/policies");
const keywordRoutes = require("./routes/keywords");
const summaryRoutes = require("./routes/summary");
//const searchRoutes = require("./routes/search");
const fileRoutes = require("./routes/files");
const uploadPolicyRoutes = require("./routes/upload-policy");
const editFields = require("./routes/edit-fields");
const movePolicyRoutes = require("./routes/move-policy");
const searchFilterRoutes = require("./routes/search-filter");

// Use routes
app.use("/api/policies", policiesRoute);
app.use("/api/policies", keywordRoutes);
app.use("/api/policies", summaryRoutes);
//app.use("/api/search", searchRoutes);
app.use("/api/policies", fileRoutes);
app.use("/api/", uploadPolicyRoutes);
//app.use("/api", editFields);
app.use("/api/policies", movePolicyRoutes);
app.use("/api/", searchFilterRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
