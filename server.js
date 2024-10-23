const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: './backend/.env' });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // In production, set secure: true with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

require('./auth/authentication')(app);

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
