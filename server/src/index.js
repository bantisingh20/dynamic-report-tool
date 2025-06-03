

const express = require('express');
const cors = require('cors'); 
const { handleError  } = require('./middlewares/ErrorHandler');
const metadataRoutes = require('./routes/metadata.routes'); 
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();
const compression = require('compression');



const app = express();
const port = 3000;
app.use(compression());

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/metadata', metadataRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


app.use(handleError);



async function runSQLFile() {
  const filePath = path.join(__dirname, 'QUERY', 'STORE MANAGEMENT QUERY.sql');

  try {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split by semicolon and remove empty lines
    const statements = sql
      .split(/;\s*$/m)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        console.error('❌ Error executing statement:\n', statement);
        console.error(err.message);
        break;
      }
    }

    console.log('✅ SQL script executed statement-by-statement.');
  } catch (err) {
    console.error('❌ Error reading SQL file:', err.message);
  } finally {
    await pool.end();
  }
}

//runSQLFile();
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected to DB:', res.rows[0]);
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

//testConnection();

// const express = require('express');
// const cors = require('cors');
// const { handleError } = require('./middlewares/ErrorHandler');
// const metadataRoutes = require('./routes/metadata.routes');
// const bodyParser = require('body-parser');
// const pool = require('./config/db');
// require('dotenv').config();

// const app = express();

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.json());

// // Routes
// app.use('/api/metadata', metadataRoutes);

// async function testConnection() {
//   try {
//     const res = await pool.query('SELECT NOW()');
//     console.log('Connected to DB:', res.rows[0]);
//   } catch (err) {
//     console.error('Database connection error:', err);
//   }
// }

// const createFunctionSQL = `
// CREATE OR REPLACE FUNCTION get_table_metadata()
// RETURNS TABLE(name TEXT, type TEXT) AS $$
// BEGIN
//   RETURN QUERY
//   SELECT table_name::TEXT, table_type::TEXT
//   FROM information_schema.tables
//   WHERE table_schema = 'public' AND table_type != 'VIEW';
// END;
// $$ LANGUAGE plpgsql;
// `;

// async function createFunction() {
//   try {
//     await pool.connect();
//     await pool.query(createFunctionSQL);
//     console.log('Function created successfully!');
//   } catch (err) {
//     console.error('Error creating function:', err.stack);
//   } finally {
//     await pool.end();
//   }
// }

// createFunction();

// // Error handler (after routes)
// app.use(handleError);

// module.exports = app; // Export plain app (used by both local and Vercel)


// const express = require('express');
// const cors = require('cors'); 
// const { handleError  } = require('./middlewares/ErrorHandler');
// const metadataRoutes = require('./routes/metadata.routes'); 
// const path = require('path');
// const bodyParser = require('body-parser');
// const { Pool } = require('pg');
// const fs = require('fs');
// require('dotenv').config();

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.json());
// app.use('/api/metadata', metadataRoutes);

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });


// app.use(handleError);



// async function runSQLFile() {
//   const filePath = path.join(__dirname, 'QUERY', 'STORE MANAGEMENT QUERY.sql');

//   try {
//     const sql = fs.readFileSync(filePath, 'utf-8');

//     // Split by semicolon and remove empty lines
//     const statements = sql
//       .split(/;\s*$/m)
//       .map(line => line.trim())
//       .filter(line => line.length > 0);

//     for (const statement of statements) {
//       try {
//         await pool.query(statement);
//       } catch (err) {
//         console.error('❌ Error executing statement:\n', statement);
//         console.error(err.message);
//         break;
//       }
//     }

//     console.log('✅ SQL script executed statement-by-statement.');
//   } catch (err) {
//     console.error('❌ Error reading SQL file:', err.message);
//   } finally {
//     await pool.end();
//   }
// }

//runSQLFile();
// async function testConnection() {
//   try {
//     const res = await pool.query('SELECT NOW()');
//     console.log('Connected to DB:', res.rows[0]);
//   } catch (err) {
//     console.error('Database connection error:', err);
//   }
// }

//testConnection();
