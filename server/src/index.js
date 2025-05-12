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
const { getData, SaveUpdate } = require('./models/metadata.model');
const { handleError  } = require('./middlewares/ErrorHandler');
require('dotenv').config();
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
// //error handling middleware


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
 

// Get all Column of Table / Views
app.get('/api/metadata/columns/:tableName', async (req, res) => {
  try {
    const tableName = req.params.tableName;
    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const result = await pool.query(
      `
      SELECT col.column_name, col.data_type
      FROM information_schema.columns col
      WHERE col.table_name = $1
      AND col.column_name NOT IN (
        -- Primary Key columns
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_name = kcu.table_name
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
        
        UNION

        -- Foreign Key columns
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_name = kcu.table_name
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
      )
      `,
      [tableName]
    );

    const data = result.rows.map(row => ({
      column_name: row.column_name,
      data_type: row.data_type
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Data For Preview
// app.post('/api/metadata/report/preview', async (req, res) => {
//   const { tableandView, selectedColumns = [], filters = [], sortBy = [], groupBy = [] } = req.body;

//   console.log(req.body)
//   try {
//     // 1. Check table exists
//     const tableResult = await pool.query(`
//       SELECT 1 FROM information_schema.tables
//       WHERE table_schema = 'public' AND table_name = $1
//     `, [tableandView]);

//     if (tableResult.rowCount === 0) {
//       return res.status(400).json({ error: `Table "${tableandView}" does not exist1.` });
//     }

//     // 2. Get column info
//     const colResult = await pool.query(`
//       SELECT column_name, data_type
//       FROM information_schema.columns
//       WHERE table_name = $1 AND table_schema = 'public'
//     `, [tableandView]);

//     const tableColumns = {};
//     colResult.rows.forEach(col => tableColumns[col.column_name] = col.data_type);

//     // 3. Validate selected columns
//     const invalidColumns = selectedColumns.filter(col => !tableColumns[col]);
//     if (invalidColumns.length) {
//       return res.status(400).json({ error: `Invalid columns: ${invalidColumns.join(', ')}` });
//     }

//     // 4. Validate filters
//     for (const [i, filter] of filters.entries()) {
//       const { field, operator, value, valueFrom, valueTo } = filter;

//       if (!field) {
//         return res.status(400).json({ error: `Filter at index ${i}: 'field' is required.` });
//       }

//       if (!tableColumns[field]) {
//         return res.status(400).json({ error: `Invalid filter column: ${field}` });
//       }

//       if (!operator) {
//         return res.status(400).json({ error: `Filter at index ${i}: 'operator' is required.` });
//       }

//       if (operator === 'between') {
//         if (valueFrom == null || valueTo == null) {
//           return res.status(400).json({ error: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.` });
//         }
//       } else {
//         if (value == null) {
//           return res.status(400).json({ error: `Filter at index ${i}: 'value' is required for operator '${operator}'.` });
//         }

//         const expected = mapDbTypeToJsType(tableColumns[field]);
//         const actual = typeof value;

//         if (expected !== actual) {
//           return res.status(400).json({
//             error: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expected}, got ${actual}`
//           });
//         }
//       }
//     }


//     // 5. Validate sortBy and groupBy

//     console.log(groupBy);
//     const badSort = sortBy.filter(col => !tableColumns[col.field]);
//     if (badSort.length) return res.status(400).json({ error: `Invalid sort columns: ${badSort.join(', ')}` });

//     const badGroup = groupBy.filter(col => !tableColumns[col.field]);
//     if (badGroup.length) return res.status(400).json({ error: `Invalid group columns: ${badGroup.join(', ')}` });

//    const config = {
//       table: tableandView,
//       selection: selectedColumns,
//       filters: filters.map(f => ({
//         field: f.field,
//         operator: f.operator,
//         value: f.value,
//         valueFrom: f.valueFrom,
//         valueTo: f.valueTo
//       })),
//       groupBy: groupBy.map(g => ({ field: g.field })) ,
//       sortBy: sortBy.map(col => ({ column: col.field, order: col.direction })) // or add dynamic order if provided
//     };

//     const data = await Executionfunction(config);
 
//     res.json({ message: 'Validation passed', data });
 
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: `Internal server error :${err.message}` });
//   }
// });


 app.post('/api/metadata/report/preview', async (req, res, next) => {
  const { tableandView, selectedColumns = [], filters = [], sortBy = [], groupBy = [] } = req.body;

  console.log(req.body);
  try {
    // 1. Check table exists
    const tableResult = await pool.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableandView]);

    if (tableResult.rowCount === 0) {
      // Throw error with status 400 if table is not found
      
      return next({
        status: 400,
        message: `Table "${tableandView}" does not exist.`,
        error: 'Table validation failed.'
      });
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
      return next({
        status: 400,
        message: `Invalid columns: ${invalidColumns.join(', ')}`,
        error: 'Invalid column selection.'
      });
    }

    // 4. Validate filters
    for (const [i, filter] of filters.entries()) {
      const { field, operator, value, valueFrom, valueTo } = filter;

      if (!field) {
        return next({
          status: 400,
          message: `Filter at index ${i}: 'field' is required.`,
          error: 'Missing filter field.'
        });
      }

      if (!tableColumns[field]) {
        return next({
          status: 400,
          message: `Invalid filter column: ${field}`,
          error: 'Invalid column in filter.'
        });
      }

      if (!operator) {
        return next({
          status: 400,
          message: `Filter at index ${i}: 'operator' is required.`,
          error: 'Missing operator in filter.'
        });
      }

      if (operator === 'between') {
        if (valueFrom == null || valueTo == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`,
            error: 'Invalid range filter.'
          });
        }
      } else {
        if (value == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'value' is required for operator '${operator}'.`,
            error: 'Missing filter value.'
          });
        }

        const expected = mapDbTypeToJsType(tableColumns[field]);
        const actual = typeof value;

        if (expected !== actual) {
          return next({
            status: 400,
            message: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expected}, got ${actual}`,
            error: 'Type mismatch in filter.'
          });
        }
      }
    }

    // 5. Validate sortBy and groupBy
    const badSort = sortBy.filter(col => !tableColumns[col.field]);
    if (badSort.length) {
      return next({
        status: 400,
        message: `Invalid sort columns: ${badSort.join(', ')}`,
        error: 'Invalid sort selection.'
      });
    }

    const badGroup = groupBy.filter(col => !tableColumns[col.field]);
    if (badGroup.length) {
      return next({
        status: 400,
        message: `Invalid group columns: ${badGroup.join(', ')}`,
        error: 'Invalid group selection.'
      });
    }

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
      groupBy: groupBy.map(g => ({ field: g.field })),
      sortBy: sortBy.map(col => ({ column: col.field, order: col.direction }))
    };

    // Call the Execution function
    const data = await Executionfunction(config);

    res.json({ message: 'Validation passed', data });
    
  } catch (err) {
    // Pass error to the common error handler
    next(err);
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

const Executionfunction = async (config) => {
  try {
    if (!config || !config.table) {
      throw new Error('Report configuration with table is required');
    }

    const table = config.table;

    // Get PK, FK of current table AND columns that are FK references in other tables
    const pkFkResult = await pool.query(
      `
      -- Primary and foreign key columns in the current table
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_name = kcu.table_name
      WHERE tc.table_name = $1
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')

      UNION

      -- Columns in the current table that are referenced by foreign keys in other tables
      SELECT ccu.column_name
      FROM information_schema.constraint_column_usage ccu
      JOIN information_schema.referential_constraints rc
        ON ccu.constraint_name = rc.unique_constraint_name
      WHERE ccu.table_name = $1
      `,
      [table]
    );

    const excludedColumns = pkFkResult.rows.map(r => r.column_name);

    // Filter selection if provided
    let selection = '*';

    if (config.selection && config.selection.length > 0) {
      const filteredSelection = config.selection.filter(col => !excludedColumns.includes(col));
      selection = filteredSelection.length > 0 ? filteredSelection.join(', ') : '*';
    } else {
      // Auto-fetch all non-PK/FK columns
      const allColumnsResult = await pool.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
        `,
        [table]
      );
      
      const allColumns = allColumnsResult.rows.map(r => r.column_name);
      const filteredColumns = allColumns.filter(col => !excludedColumns.includes(col));
      selection = filteredColumns.length > 0 ? filteredColumns.join(', ') : '*';
    }

    let sql = `SELECT ${selection} FROM ${table}`;
    const params = [];
    let paramIndex = 1;

    // WHERE clause
    if (config.filters && config.filters.length > 0) {
      const filterClauses = config.filters.map(filter => {
        const sqlOperator = operatorMap[filter.operator.toLowerCase()];
        if (!sqlOperator) throw new Error(`Unsupported operator: ${filter.operator}`);

        if (sqlOperator === 'BETWEEN') {
          params.push(filter.valueFrom, filter.valueTo);
          return `${filter.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        } else if (sqlOperator === 'ILIKE') {
          params.push(`%${filter.value}%`);
          return `${filter.field} ILIKE $${paramIndex++}`;
        } else {
          params.push(filter.value);
          return `${filter.field} ${sqlOperator} $${paramIndex++}`;
        }
      }).join(' AND ');
      sql += ` WHERE ${filterClauses}`;
    }

    // ORDER BY
    if (config.sortBy && config.sortBy.length > 0) {
      const sortClauses = config.sortBy.map(sort => `${sort.column} ${sort.order}`).join(', ');
      sql += ` ORDER BY ${sortClauses}`;
    }

    console.log("Executing SQL:", sql, 'with params:', params);
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    // Returning error in same format for consistency with your middleware
    throw {
      status: 500,
      message: "Query execution failed",
      error: err.message
    };
  }
};


const operatorMap = {
  'equals': '=',
  'not equals': '!=',
  'greater than': '>',
  'less than': '<',
  'between': 'BETWEEN',
  'contains': 'ILIKE' // Use 'LIKE' if not using PostgreSQL or want case-sensitive
};

// List all saved reports (for the "Saved Reports" view)
app.get('/api/metadata/List-Report', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT report_id, report_name FROM report_configuration`);
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


// dynamic_query_proc Save a report configuration (assumes a table "reports" exists with columns: id, report_name, config)
app.post('/api/metadata/report/save', async (req, res) => {
  try {
     const { reportName,tableandView,axisConfig,userId, selectedColumns = [], filters = [], sortBy = [], groupBy = [] } = req.body;

    if (!reportName ) {
      return res.status(400).json({ error: 'Report name and configuration are required' });
    }
    const data = await SaveUpdate(tableandView, reportName, selectedColumns, userId, filters, groupBy, sortBy, axisConfig);
    const reportId = data;
    res.status(200).json({ message:"Report Save Successfully",id: reportId});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


app.use(handleError);