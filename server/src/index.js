// const express = require('express');
// const cors = require('cors');
// const pool = require('./config/db.js');
// const metadataRoutes = require('./routes/metadata.routes'); 
// const { ErrorHandling } = require('./middlewares/ErrorHandler.js');
// require('dotenv').config(); 
// const app = express();
// const PORT = 3000;
 

// //middleware
// app.use(express.json());
// app.use(cors());

// //routes


// //error handling middleware
// app.use(ErrorHandling);

// //connection test
// app.get("/",async(req,res)=>{
//     console.log(res);
//     const result = await pool.query("select current_database()");
//     res.send(`The database name is : ${result.rows[0].current_database}`);
// })


// // GET /api/metadata/tables
// app.use('/api/metadata', metadataRoutes);
 

// //server running 

// app.listen(PORT,async () =>{
//    // console.log(process.env.PGHOST);
// //    const result = await pool.query("select current_database()");
// //     console.log(`The database name is : ${result.rows[0].current_database}`);
//     console.log(`Server is running on localhost :${PORT}`);
// })

// server.js
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const { getData } = require('./models/metadata.model');
require('dotenv').config();
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Configure your PostgreSQL connection accordingly.
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: "Setu@123",
  database: process.env.PGDATABASE
});

// Get all public tables/views
app.get('/api/metadata/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name as name,table_type as type
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const data = result.rows.map(row => ({
    name: row.name,
    type: row.type
  }))
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get metadata (columns) for a selected table
app.get('/api/metadata/columns/:tableName', async (req, res) => {
  try {
    const tableName = req.params.tableName;
    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    const result = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns 
       WHERE table_name = $1`,
      [tableName]
    );
    const data = result.rows.map(row => ({  column_name: row.column_name,  data_type: row.data_type}))
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/metadata/report/preview', async (req, res) => {
  const { tableandView, selectedColumns = [], filters = [], sortBy = [], groupBy = [] } = req.body;

  console.log(req.body)
  try {
    // 1. Check table exists
    const tableResult = await pool.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableandView]);

    if (tableResult.rowCount === 0) {
      return res.status(400).json({ error: `Table "${tableandView}" does not exist1.` });
    }

    // 2. Get column info
    const colResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableandView]);

    const tableColumns = {};
    colResult.rows.forEach(col => tableColumns[col.column_name] = col.data_type);

    // 3. Validate selected columns
    const invalidColumns = selectedColumns.filter(col => !tableColumns[col]);
    if (invalidColumns.length) {
      return res.status(400).json({ error: `Invalid columns: ${invalidColumns.join(', ')}` });
    }

    // 4. Validate filters
    for (const [i, filter] of filters.entries()) {
      const { field, operator, value, valueFrom, valueTo } = filter;

      if (!field) {
        return res.status(400).json({ error: `Filter at index ${i}: 'field' is required.` });
      }

      if (!tableColumns[field]) {
        return res.status(400).json({ error: `Invalid filter column: ${field}` });
      }

      if (!operator) {
        return res.status(400).json({ error: `Filter at index ${i}: 'operator' is required.` });
      }

      if (operator === 'between') {
        if (valueFrom == null || valueTo == null) {
          return res.status(400).json({ error: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.` });
        }
      } else {
        if (value == null) {
          return res.status(400).json({ error: `Filter at index ${i}: 'value' is required for operator '${operator}'.` });
        }

        const expected = mapDbTypeToJsType(tableColumns[field]);
        const actual = typeof value;

        if (expected !== actual) {
          return res.status(400).json({
            error: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expected}, got ${actual}`
          });
        }
      }
    }


    // 5. Validate sortBy and groupBy

    console.log(groupBy);
    const badSort = sortBy.filter(col => !tableColumns[col.field]);
    if (badSort.length) return res.status(400).json({ error: `Invalid sort columns: ${badSort.join(', ')}` });

    const badGroup = groupBy.filter(col => !tableColumns[col.field]);
    if (badGroup.length) return res.status(400).json({ error: `Invalid group columns: ${badGroup.join(', ')}` });

   const config = {
      table: tableandView,
      selection: selectedColumns,
      filters: filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo
      })),
      groupBy: groupBy.map(g => ({ field: g.field })) ,
      sortBy: sortBy.map(col => ({ column: col.field, order: col.direction })) // or add dynamic order if provided
    };

    const data = await Executionfunction(config);
 
    res.json({ message: 'Validation passed', data });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Internal server error :${err.message}` });
  }
});



function mapDbTypeToJsType(dbType) {
  if (['integer', 'int', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision'].includes(dbType)) {
    return 'number';
  }
  if (['varchar', 'text', 'char', 'uuid'].includes(dbType)) {
    return 'string';
  }
  if (['boolean'].includes(dbType)) {
    return 'boolean';
  }
  if (['date', 'timestamp', 'datetime'].includes(dbType)) {
    return 'string'; // usually sent as ISO string
  }
  return 'string'; // fallback
}


// app.post('/report/execute', async (req, res) => {
//   try {
//     const { config } = req.body;
//     if (!config || !config.table) {
//       return res.status(400).json({ error: 'Report configuration with table is required' });
//     }
    
//     // Build the SELECT clause (if selection provided; else use "*")
//     const selectClause = config.selection && config.selection.length ? config.selection.join(', ') : '*';
//     let sql = `SELECT ${selectClause} FROM ${config.table}`;

//     // Build the WHERE conditions based on filters
//     if (config.filters && config.filters.length > 0) {
//       const filterClauses = config.filters.map(filter => {
//         // For proper security, use parameter binding or whitelist allowed operators/columns.
//         // Here we assume the values come from UI validated by metadata.
//         return `${filter.column} ${filter.operator} '${filter.value}'`;
//       }).join(' AND ');
//       sql += ` WHERE ${filterClauses}`;
//     }

//     // Add GROUP BY clause
//     if (config.groupBy && config.groupBy.length > 0) {
//       sql += ` GROUP BY ${config.groupBy.join(', ')}`;
//     }

//     // Add ORDER BY clause
//     if (config.sortBy && config.sortBy.length > 0) {
//       const sortClauses = config.sortBy.map(sort => `${sort.column} ${sort.order}`).join(', ');
//       sql += ` ORDER BY ${sortClauses}`;
//     }

//     console.log("Executing SQL:", sql);
//     const result = await pool.query(sql);
//     res.json({ rows: result.rows });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });


const Executionfunction = async (config) => {
  try {
    if (!config || !config.table) {
      throw new Error('Report configuration with table is required');
    }

    const selectClause = config.selection && config.selection.length
      ? config.selection.join(', ')
      : '*';

    let sql = `SELECT ${selectClause} FROM ${config.table}`;
    const params = [];
    let paramIndex = 1;

    // WHERE clause
    if (config.filters && config.filters.length > 0) {
      const filterClauses = config.filters.map(filter => {
        if (filter.operator.toLowerCase() === 'between') {
          params.push(filter.valueFrom, filter.valueTo);
          return `${filter.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        } else {
          params.push(filter.value);
          return `${filter.field} ${filter.operator} $${paramIndex++}`;
        }
      }).join(' AND ');
      sql += ` WHERE ${filterClauses}`;
    }

     
    // GROUP BY
    //     if (config.groupBy && config.groupBy.length > 0) {
    //   const groupByFields = config.groupBy.map(item => item.field).join(', ');
    //   sql += ` GROUP BY ${groupByFields}`;
    // }


    // ORDER BY
    if (config.sortBy && config.sortBy.length > 0) {
      const sortClauses = config.sortBy.map(sort => `${sort.column} ${sort.order}`).join(', ');
      sql += ` ORDER BY ${sortClauses}`;
    }

    console.log("Executing SQL:", sql, 'with params:', params);
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    throw new Error(`Query execution failed: ${err.message}`);
  }
};



// List all saved reports (for the "Saved Reports" view)
app.get('/reports', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, report_name FROM reports`);
    res.json({ reports: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve a saved report configuration by id
app.get('/report/load/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM reports WHERE id = $1`,
      [reportId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Save a report configuration (assumes a table "reports" exists with columns: id, report_name, config)
app.post('/report/save', async (req, res) => {
  try {
    const { reportName, config } = req.body;
    if (!reportName || !config) {
      return res.status(400).json({ error: 'Report name and configuration are required' });
    }
    const result = await pool.query(
      `INSERT INTO reports (report_name, config)
       VALUES ($1, $2)
       RETURNING id`,
      [reportName, config]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
