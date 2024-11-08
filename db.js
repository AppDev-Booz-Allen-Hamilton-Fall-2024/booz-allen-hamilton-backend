const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
  user: 'buenosnachos',      
  host: 'localhost',         
  database: 'adc', 
  password: '12345',
  port: 5432,                  
});

// Export the pool instance to be used in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};