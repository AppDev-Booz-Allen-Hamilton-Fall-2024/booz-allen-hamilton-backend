const { Pool } = require("pg");

// Create a new pool instance
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "adc",
  password: "adc",
  port: 5432,
});

// Export the pool instance to be used in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};
