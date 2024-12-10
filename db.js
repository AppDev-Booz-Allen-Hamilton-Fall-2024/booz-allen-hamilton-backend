const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
  user: 'sohamkatdare',      
  host: 'localhost',         
  database: 'adc', 
  password: '1234',
  port: 5432,                  
});

// Export the pool instance to be used in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};