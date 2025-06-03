 const { Pool } = require('pg');
 require('dotenv').config();

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Setu@123",
  database: "StoreManagement"
}); 
 
// const pool = new Pool({
//   connectionString: 'postgresql://postgres:SKqTcQtPohmCkonIcSGnyLaFWYzVZZie@crossover.proxy.rlwy.net:59877/railway',
//   ssl: {
//     rejectUnauthorized: false // Needed if Railway uses SSL
//   }
// }); 
module.exports = pool;
