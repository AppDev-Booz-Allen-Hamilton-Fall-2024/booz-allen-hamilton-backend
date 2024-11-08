const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

require('./authentication')(app); //This will make sure authentication is done

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});


// Policies 
app.use('/api/policies', policiesRoute); 
const policiesRoute = require('./routes/policies');

//Keywords
const keywordRoutes = require('./routes/keywords');
app.use('/api/policies', keywordRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
