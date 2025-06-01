 const { Pool } = require('pg');
 require('dotenv').config();

// const pool = new Pool({
//   host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   user: process.env.PGUSER,
//   password: "Setu@123",
//   database: process.env.PGDATABASE
// });

// module.exports = pool;
 
const pool = new Pool({
  connectionString: 'postgresql://postgres:SKqTcQtPohmCkonIcSGnyLaFWYzVZZie@crossover.proxy.rlwy.net:59877/railway',
  ssl: {
    rejectUnauthorized: false // Needed if Railway uses SSL
  }
});

//const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

module.exports = pool;
