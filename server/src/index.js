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
      WHERE table_schema = 'public' and table_type !='VIEW'
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
 
// app.post('/api/check-table-relations', async (req, res) => {
//   try {

//     const { selectedTables } = req.body;
//       const query = `
//       SELECT
//         tc.table_name AS source_table,
//         kcu.column_name AS source_column,
//         ccu.table_name AS target_table,
//         ccu.column_name AS target_column
//       FROM 
//         information_schema.table_constraints AS tc 
//         JOIN information_schema.key_column_usage AS kcu
//           ON tc.constraint_name = kcu.constraint_name
//         JOIN information_schema.constraint_column_usage AS ccu
//           ON ccu.constraint_name = tc.constraint_name
//       WHERE constraint_type = 'FOREIGN KEY'
//         AND (tc.table_name = ANY($1) OR ccu.table_name = ANY($1));
//     `;

//     const { rows } = await pool.query(query, [selectedTables]);
    
//     // Process relationships
//     const relatedTables = new Set();
//     const columnsByTable = {};

//     for (const row of rows) {
//         relatedTables.add(row.source_table);
//         relatedTables.add(row.target_table);
//     }

//     // Now fetch columns
//     const columnsQuery = `
//         SELECT table_name, column_name
//         FROM information_schema.columns
//         WHERE table_name = ANY($1)
//     `;
//     const columnResult = await pool.query(columnsQuery, [[...relatedTables]]);
    
//     columnResult.rows.forEach(row => {
//         if (!columnsByTable[row.table_name]) {
//             columnsByTable[row.table_name] = [];
//         }
//         columnsByTable[row.table_name].push(row.column_name);
//     });

//      const data = { relatedTables: [...relatedTables], columnsByTable };
    
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


app.post('/api/metadata/check-table-relations', async (req, res) => {
  try {
    const { selectedTables } = req.body;

    const query = `
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = ANY($1) OR ccu.table_name = ANY($1));
    `;

    const { rows } = await pool.query(query, [selectedTables]);

    const relatedTables = new Set();
    const fkColumns = new Set();

    for (const row of rows) {
      relatedTables.add(row.source_table);
      relatedTables.add(row.target_table);
      fkColumns.add(`${row.source_table}.${row.source_column}`);
      fkColumns.add(`${row.target_table}.${row.target_column}`);
    }

    // Get primary key columns
    const pkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = ANY($1);
    `;

    const pkResult = await pool.query(pkQuery, [[...relatedTables]]);
    const pkColumns = new Set();
    pkResult.rows.forEach(row => {
      pkColumns.add(`${row.table_name}.${row.column_name}`);
    });

    // Now fetch all columns and exclude PK + FK
    const columnsQuery = `
      SELECT table_name, column_name,data_type
      FROM information_schema.columns
      WHERE table_name = ANY($1)
    `;
    const columnResult = await pool.query(columnsQuery, [[...relatedTables]]);

    const columnsByTable = {};

    columnResult.rows.forEach(row => {
      const key = `${row.table_name}.${row.column_name}`;
      if (!pkColumns.has(key) && !fkColumns.has(key)) {
        if (!columnsByTable[row.table_name]) {
          columnsByTable[row.table_name] = [];
        }
        columnsByTable[row.table_name].push({column_name :row.column_name, data_type: row.data_type});
      }
    });

    res.json({ relatedTables: [...relatedTables], columnsByTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

 

// Get all Column of Table / Views  SELECT * FROM get_columns_for_tables(ARRAY['products', 'users', 'orders'])
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

app.post('/api/metadata/report/preview', async (req, res, next) => {
  const {
    report_name,
    tableandview = [],
    selectedcolumns = [],
    xyaxis = [],
    filters = [],
    sortby = [],
    groupby = []
  } = req.body;

  console.log(req.body);

  try {
    // 1. Validate table list
    const tableResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [tableandview]);

    const foundTables = tableResult.rows.map(row => row.table_name);
    const missingTables = tableandview.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      return next({
        status: 400,
        message: `The following tables do not exist: ${missingTables.join(', ')}`,
        error: 'Table validation failed.'
      });
    }

    // 2. Check foreign key relationships among tables
        const relResult = await pool.query(`
          SELECT
            conrelid::regclass::text AS source_table,
            confrelid::regclass::text AS target_table
          FROM pg_constraint
          WHERE contype = 'f'
            AND conrelid::regclass::text = ANY($1)
            AND confrelid::regclass::text = ANY($1)
        `, [tableandview]);

        console.log(relResult.rows);
        const relatedPairs = new Set(relResult.rows.map(row =>
          [row.source_table, row.target_table].sort().join(',')
        ));

        if (relatedPairs.size === 0 && tableandview.length > 1) {
          return next({
            status: 400,
            message: `The selected tables are not related to each other.`,
            error: 'Table relationship validation failed.'
          });
        }
  
    

    // 2. Fetch columns for all tables
    const colResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [tableandview]);

    // Build a lookup: table.column => data_type
    const columnMap = new Map();
    colResult.rows.forEach(row => {
      columnMap.set(`${row.table_name}.${row.column_name}`, row.data_type);
    });

    // 3. Validate selectedColumns (e.g. ["orders.date", "users.name"])
    const invalidColumns = selectedcolumns.filter(col => !columnMap.has(col));
    if (invalidColumns.length > 0) {
      return next({
        status: 400,
        message: `Invalid selected columns: ${invalidColumns.join(', ')}`,
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

      if (!columnMap.has(field)) {
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
          error: 'Missing operator.'
        });
      }

      if (operator === 'between') {
        if (valueFrom == null || valueTo == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`,
            error: 'Missing range values.'
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
        
        const valueAsNumber = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
        const expectedType = mapDbTypeToJsType(columnMap.get(field));
        console.log("Expected type:", expectedType);
        let actualType = typeof valueAsNumber;
        console.log("Actual type:", actualType);
         
         if (expectedType === 'string' && actualType === 'number') {
           // value = String(value);
           actualType = 'string';
         } 
        
        if (expectedType !== actualType) {
          return next({
            status: 400,
            message: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expectedType}, got ${actualType}`,
            error: 'Type mismatch in filter.'
          });
        }
      }
    }

    // 5. Validate sortBy and groupBy
    const badSort = sortby.filter(col => !columnMap.has(col.field));
    if (badSort.length > 0) {
      return next({
        status: 400,
        message: `Invalid sort columns: ${badSort.map(c => c.field).join(', ')}`,
        error: 'Invalid sort selection.'
      });
    }


    // ✅ 3. Check if groupby columns are also included in selectedColumns
        const selectedColumnSet = new Set(selectedcolumns);
        const missingInSelect = groupby
          .map(col => col.field)
          .filter(field => !selectedColumnSet.has(field));

        if (missingInSelect.length > 0) {
          return next({
            status: 400,
            message: `Group by columns must be selected: ${missingInSelect.join(', ')}`,
            error: 'Invalid group selection.'
          });
        }

    // groyup by 
    const badGroup = groupby.filter(col => !columnMap.has(col.field));
    if (badGroup.length > 0) {
      return next({
        status: 400,
        message: `Invalid group columns: ${badGroup.map(c => c.field).join(', ')}`,
        error: 'Invalid group selection.'
      });
    }

    // 6. Build config   
 
    const config = {
      tables: tableandview,
      selection: selectedcolumns,
      filters: filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo
      })),
      groupBy: groupby.map(g => ({ field: g.field })),
      sortBy: sortby.map(col => ({
        column: col.field,
        order: col.direction
      })),
      xyaxis: xyaxis.map(axis => ({
        x: {
          field: axis.xAxisField,
          order: axis.xAxisDirection
        },
        y: {
          field: axis.yAxisField,
          order: axis.yAxisDirection
        }
      }))
    };

    // 7. Execute business logic
    const data = await Executionfunction(config);

    // 8. Prepare chartData (grouped by x-axis field)
    let chartData;
    const xAxisField = config.xyaxis[0]?.x.field;
    if (xAxisField) {
      const groupedData = {};
      for (const row of data) {
        const key = row[xAxisField];
        groupedData[key] = (groupedData[key] || 0) + 1;
      }

      chartData = Object.entries(groupedData).map(([key, count]) => ({
        x: key,
        y: count
      }));
    }

    res.json({ message: 'Validation passed', data, chartData });

  } catch (err) {
    next(err);
  }
});

//  app.post('/api/metadata/report/preview', async (req, res, next) => {
//   const { report_name,tableandview=[], selectedColumns = [] ,xyaxis=[], filters = [], sortBy = [], groupBy = [] } = req.body;
   
//   console.log(req.body);
//   try {
//     // 1. Check table exists
//     const tableResult = await pool.query(`
//       SELECT 1 FROM information_schema.tables
//       WHERE table_schema = 'public' AND table_name = $1
//     `, [tableandview]);

//     if (tableResult.rowCount === 0) {
//       // Throw error with status 400 if table is not found
      
//       return next({
//         status: 400,
//         message: `Table "${tableandview}" does not exist.`,
//         error: 'Table validation failed.'
//       });
//     }

//     // 2. Get column info
//     const colResult = await pool.query(`
//       SELECT column_name, data_type
//       FROM information_schema.columns
//       WHERE table_name = $1 AND table_schema = 'public'
//     `, [tableandview]);

//     const tableColumns = {};
//     colResult.rows.forEach(col => tableColumns[col.column_name] = col.data_type);

//     // 3. Validate selected columns
//     const invalidColumns = selectedColumns.filter(col => !tableColumns[col]);
//     if (invalidColumns.length) {
//       return next({
//         status: 400,
//         message: `Invalid columns: ${invalidColumns.join(', ')}`,
//         error: 'Invalid column selection.'
//       });
//     }

//     // 4. Validate filters
//     for (const [i, filter] of filters.entries()) {
//       const { field, operator, value, valueFrom, valueTo } = filter;

//       if (!field) {
//         return next({
//           status: 400,
//           message: `Filter at index ${i}: 'field' is required.`,
//           error: 'Missing filter field.'
//         });
//       }

//       if (!tableColumns[field]) {
//         return next({
//           status: 400,
//           message: `Invalid filter column: ${field}`,
//           error: 'Invalid column in filter.'
//         });
//       }

//       if (!operator) {
//         return next({
//           status: 400,
//           message: `Filter at index ${i}: 'operator' is required.`,
//           error: 'Missing operator in filter.'
//         });
//       }

//       if (operator === 'between') {
//         if (valueFrom == null || valueTo == null) {
//           return next({
//             status: 400,
//             message: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`,
//             error: 'Invalid range filter.'
//           });
//         }
//       } else {
//         if (value == null) {
//           return next({
//             status: 400,
//             message: `Filter at index ${i}: 'value' is required for operator '${operator}'.`,
//             error: 'Missing filter value.'
//           });
//         }

//         const expected = mapDbTypeToJsType(tableColumns[field]);
//         const actual = typeof value;

//         if (expected !== actual) {
//           return next({
//             status: 400,
//             message: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expected}, got ${actual}`,
//             error: 'Type mismatch in filter.'
//           });
//         }
//       }
//     }

//     // 5. Validate sortBy and groupBy
//     const badSort = sortBy.filter(col => !tableColumns[col.field]);
//     if (badSort.length) {
//       return next({
//         status: 400,
//         message: `Invalid sort columns: ${badSort.join(', ')}`,
//         error: 'Invalid sort selection.'
//       });
//     }

//     const badGroup = groupBy.filter(col => !tableColumns[col.field]);
//     if (badGroup.length) {
//       return next({
//         status: 400,
//         message: `Invalid group columns: ${badGroup.join(', ')}`,
//         error: 'Invalid group selection.'
//       });
//     }

//     const config = {
//       table: tableandview,
//       selection: selectedColumns,
//       filters: filters.map(f => ({
//         field: f.field,
//         operator: f.operator,
//         value: f.value,
//         valueFrom: f.valueFrom,
//         valueTo: f.valueTo
//       })),
//       groupBy: groupBy.map(g => ({ field: g.field })),
//       sortBy: sortBy.map(col => ({ column: col.field, order: col.direction })),
//       xyaxis: xyaxis.map(axis => ({
//         x: {
//           field: axis.xAxisField,
//           order: axis.xAxisDirection
//         },
//         y: {
//           field: axis.yAxisField,
//           order: axis.yAxisDirection
//         }
//       }))
//     };

//     // Call the Execution function

//     var chartData;
//     const data = await Executionfunction(config); 

//       const xAxisField = config.xyaxis[0]?.x.field;

//       if (xAxisField) {
//         const groupedData = {};

//         for (const row of data) {
//           const key = row[xAxisField];
//           groupedData[key] = (groupedData[key] || 0) + 1;
//         }

//         chartData = Object.entries(groupedData).map(([key, count]) => ({
//           x: key,
//           y: count
//         }));

//         console.log('Chart Data:', chartData);
//       }

//     res.json({ message: 'Validation passed', data,chartData });
    
//   } catch (err) {
//     // Pass error to the common error handler
//     next(err);
//   }
// });


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

const Executionfunction_oldgroupnotwork = async (config) => {
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

const Executionfunction2 = async (config) => {
  try {
    if (!config || !config.table) {
      throw new Error('Report configuration with table is required');
    }

    const table = config.table;

    // Get PK/FK columns
    const pkFkResult = await pool.query(
      `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_name = kcu.table_name
      WHERE tc.table_name = $1
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')

      UNION

      SELECT ccu.column_name
      FROM information_schema.constraint_column_usage ccu
      JOIN information_schema.referential_constraints rc
        ON ccu.constraint_name = rc.unique_constraint_name
      WHERE ccu.table_name = $1
      `,
      [table]
    );

    const excludedColumns = pkFkResult.rows.map(r => r.column_name);

    // Filtered selection
    let selection = '*';

    if (config.selection && config.selection.length > 0) {
      const filteredSelection = config.selection.filter(col => !excludedColumns.includes(col));
      selection = filteredSelection.length > 0 ? filteredSelection.join(', ') : '*';
    } else {
      const allColumnsResult = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      const allColumns = allColumnsResult.rows.map(r => r.column_name);
      const filteredColumns = allColumns.filter(col => !excludedColumns.includes(col));
      selection = filteredColumns.length > 0 ? filteredColumns.join(', ') : '*';
    }

    const params = [];
    let paramIndex = 1;

    // WHERE clause
    let whereClause = '';
    if (config.filters && config.filters.length > 0) {
      const filterClauses = config.filters.map(filter => {
        const sqlOperator = operatorMap[filter.operator.toLowerCase()];
        if (!sqlOperator) throw new Error(`Unsupported operator: ${filter.operator}`);

        if (sqlOperator === 'BETWEEN') {
          params.push(filter.valueFrom, filter.valueTo);
          return `${filter.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        } else if (sqlOperator === 'ILIKE' || sqlOperator === 'contain') {
          params.push(`%${filter.value}%`);
          return `${filter.field} ILIKE $${paramIndex++}`;
        } else {
          params.push(filter.value);
          return `${filter.field} ${sqlOperator} $${paramIndex++}`;
        }
      }).join(' AND ');
      whereClause = ` WHERE ${filterClauses}`;
    }

    // GROUP BY logic
    if (config.groupBy && config.groupBy.length > 0) {
      const groupByCols = config.groupBy.map(g => g.field).join(', ');

      // Build subquery for each group
      const groupedSQL = `
          SELECT sub.${groupByCols}, 
                JSON_AGG(sub) AS records
          FROM (
              SELECT ${selection}
              FROM ${table}
              ${whereClause ? `WHERE ${whereClause}` : ''}
          ) sub
          GROUP BY sub.${groupByCols}
      `;

      console.log("Executing GROUPED SQL:", groupedSQL, 'with params:', params);
      const result = await pool.query(groupedSQL, params);
      return { groupBy: config.groupBy,  data: result.rows };
    }

    // Regular (non-grouped) query
    let sql = `SELECT ${selection} FROM ${table}${whereClause}`;

    // ORDER BY
    if (config.sortBy && config.sortBy.length > 0) {
      const sortClauses = config.sortBy.map(sort => `${sort.column} ${sort.order}`).join(', ');
     // console.log(sortClauses);
      sql += ` ORDER BY ${sortClauses}`;
    }

    console.log("Executing SQL:", sql, 'with params:', params);
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    throw {
      status: 500,
      message: "Query execution failed",
      error: err.message
    };
  }
};

 

const Executionfunction = async (config) => {
  try {
    if (!config || !config.tables || config.tables.length === 0) {
      throw new Error('Report configuration with at least one table is required');
    }
    
 
    const tables = config.tables;

    // --- Get FK/PK relationships for JOINs ---
    const joinQuery = `
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = 'public'
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = 'public'
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = ANY($1) OR ccu.table_name = ANY($1))
    `;

    const relationRes = await pool.query(joinQuery, [tables]);
    const relations = relationRes.rows;
 
    // --- Build JOIN logic ---
    let fromClause = `FROM ${tables[0]}`;
    const joinedTables = new Set([tables[0]]);
     console.log('Initial Joined Tables:', joinedTables);

    // for (const rel of relations) {
    //   const { source_table, source_column, target_table, target_column } = rel;

    //   // ✅ Only join if BOTH tables are in config.tables
    //   if (
    //     config.tables.includes(source_table) &&
    //     config.tables.includes(target_table)
    //   ) {
    //     // Choose base/join tables depending on what's already joined
    //     const alreadyJoined = [...joinedTables];
    //     const canJoinSource = joinedTables.has(source_table) && !joinedTables.has(target_table);
    //     const canJoinTarget = joinedTables.has(target_table) && !joinedTables.has(source_table);

    //     if (canJoinSource) {
    //       fromClause += ` JOIN ${target_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
    //       joinedTables.add(target_table);
    //     } else if (canJoinTarget) {
    //       fromClause += ` JOIN ${source_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
    //       joinedTables.add(source_table);
    //     }
    //   }
    // }

  
  let allTablesJoined = false;

  while (!allTablesJoined) {
    let orderedRelations = [...relations].sort((a, b) => {
      // Sort by source_table or target_table based on what's already joined
      if (joinedTables.has(a.source_table) || joinedTables.has(a.target_table)) return -1;
      return 1;
    });

    console.log('Ordered Relations:', orderedRelations);

    let tablesJoinedThisRound = false;

      // Loop over the relations and build the joins
      for (const rel of orderedRelations) {
        const { source_table, source_column, target_table, target_column } = rel;

        // ✅ Only proceed if both source_table and target_table are in selected tables
        if (config.tables.includes(source_table) && config.tables.includes(target_table)) {
          const sourceJoined = joinedTables.has(source_table);
          const targetJoined = joinedTables.has(target_table);

          console.log(`Trying to join: ${source_table} -> ${target_table}`, sourceJoined, targetJoined);

          // 🔁 Join only if one of the tables is already joined
          if (sourceJoined && !targetJoined) {
            fromClause += ` JOIN ${target_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
            joinedTables.add(target_table);  // Mark the target table as joined
            tablesJoinedThisRound = true;
          } else if (!sourceJoined && targetJoined) {
            fromClause += ` JOIN ${source_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
            joinedTables.add(source_table);  // Mark the source table as joined
            tablesJoinedThisRound = true;
          }

          // ✅ Avoid adding duplicate joins if both tables are already joined
        }
      }

      // Check if all tables are joined
    allTablesJoined = config.tables.every(table => joinedTables.has(table));

    if (!allTablesJoined) {
      console.log("Not all tables joined yet. Continuing...");
    }
  }

  console.log('Final FROM clause:', fromClause);
  console.log('Joined tables:', joinedTables);

    // --- Colum Selection ---
    let selection = '*';
    
    if (config.selection?.length > 0) {
      selection = config.selection.map(col => {
        const [table, column] = col.split('.');
        return `${table}.${column} AS "${table} - ${column}"`;
      }).join(', ');
    }


    if(selection == "*"){
       return next({
        status: 400,
        message: `Invalid column selection`,
        error: 'Invalid column selection.'
      });
    }

    // --- WHERE clause ---
    const params = [];
    let paramIndex = 1;
    let whereClause = '';

    if (config.filters?.length > 0) {
      const filterClauses = config.filters.map(filter => {
        const sqlOperator = operatorMap[filter.operator.toLowerCase()];
        if (!sqlOperator) throw new Error(`Unsupported operator: ${filter.operator}`);

        if (sqlOperator === 'BETWEEN') {
          params.push(filter.valueFrom, filter.valueTo);
          return `${filter.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        } else if (sqlOperator === 'ILIKE' || filter.operator === 'contain') {
          params.push(`%${filter.value}%`);
          return `${filter.field} ILIKE $${paramIndex++}`;
        } else {
          params.push(filter.value);
          return `${filter.field} ${sqlOperator} $${paramIndex++}`;
        }
      }).join(' AND ');

      whereClause = ` WHERE ${filterClauses}`;
    }
 

    // --- ORDER BY clause ---
    let orderByClause = '';
    if (config.sortBy?.length > 0) {
      const sortFields = config.sortBy.map(s => `${s.column} ${s.order}`);
      orderByClause = ` ORDER BY ${sortFields.join(', ')}`;
    }


   if (config.groupBy?.length > 0) {
  // Build group-by display fields: SELECT category.name AS "category - name"
  const groupFields = config.groupBy.map(g => {
    const [table, column] = g.field.split('.');
    return `"${table} - ${column}"`;
  });

  // Raw group-by fields: category.name, product.id, etc.
  //const groupByRaw = config.groupBy.map(g => g.field).join(', ');

  const groupByRaw = config.groupBy.map(g => {
    const [table, column] = g.field.split('.');
    return `"${table} - ${column}"`;
  });

  const groupByRaw1 = config.groupBy.map(g => {
    const [table, column] = g.field.split('.');
    return `${table} - ${column}`;
  });

  // Fields to select inside subquery
  const selectionFields = config.selection.map(col => {
    const [table, column] = col.split('.');
    return `${table}.${column} AS "${table} - ${column}"`;
  }).join(', ');

  

  // Construct the final grouped SQL
  const groupedSQL = `
    SELECT ${groupFields.join(', ')} ,
      JSON_AGG(sub) AS records
    FROM (
      SELECT ${selectionFields}
      ${fromClause}
      ${whereClause}
      ${orderByClause}
    ) sub
    GROUP BY ${groupByRaw}
  `;

  console.log(`banti ${selectionFields}`)
  console.log("Executing GROUPED SQL:", groupedSQL, 'with params:', params);
  const result = await pool.query(groupedSQL, params);

  return {
    groupBy: groupByRaw1,
    data: result.rows
  };
}



    // --- Final SQL ---
    const sql = `SELECT ${selection} ${fromClause}${whereClause}${orderByClause}`;

    console.log("Executing SQL:", sql);
    const result = await pool.query(sql, params);

    return result.rows;

  } catch (err) {
    throw {
      status: 500,
      message: 'Query execution failed',
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
    const result = await pool.query(`SELECT report_id,report_name,table_name as tableandView,selected_columns as selectedColumns,filter_criteria as filters,group_by as groupBy,sort_order as sortBy FROM report_configuration`);
    res.json({ reports: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve a saved report configuration by id
app.get('/api/metadata/report/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM report_configuration WHERE report_id = $1`,
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


// dynamic_query_proc Save a report configuration  
app.post('/api/metadata/report/save/:id', async (req, res) => {
  try {
     const { reportname,tableandview = [],xyaxis,userId, selectedcolumns = [], filters = [], sortby = [], groupby = [] } = req.body;
    const reportId = req.params.id;
    if (!reportname ) {
      return res.status(400).json({ error: 'Report name and configuration are required' });
    }
    const data = await SaveUpdate(reportId,tableandview, reportname, selectedcolumns, userId, filters, groupby, sortby, xyaxis);
 
    res.status(200).json({ message:"Report Save Successfully",id: data});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


app.use(handleError);















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

