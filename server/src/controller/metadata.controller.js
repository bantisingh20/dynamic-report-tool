const pool = require("../config/db.js");
const { Executionfunction} = require("../models/metadata.model");
const { mapDbTypeToJsType } = require("../utils/Operator.utils.js");

async function listTablesAndViews(req, res) {
  try {
    const result = await pool.query(`
      SELECT table_name as name,table_type as type
      FROM information_schema.tables
      WHERE table_schema = 'public' and table_type !='VIEW'
    `);
    //const result = await pool.query('select * from get_table_metadata()')
    const data = result.rows.map((row) => ({
      name: row.name,
      type: row.type,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function CheckRelationAndListOfColumn(req, res) {
  try {
    debugger;
    const { selectedTables } = req.body;

    // If only one table is selected, return its columns
    if (selectedTables.length === 1) {
      const singleTable = selectedTables[0];

      // Get columns for the single table
      const columnsQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1;
      `;
      const columnResult = await pool.query(columnsQuery, [singleTable]);

      const columns = columnResult.rows.map((row) => ({
        column_name: row.column_name,
        data_type: row.data_type,
      }));
      //return res.json({ relatedTables: [...relatedTables], columnsByTable });
      return res.json({
        relatedTables: [singleTable],
        columnsByTable: { [singleTable]: columns },
      });
    }

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

    const { rows } = await pool.query(query, [selectedTables]); // this will show all table which are link with pass table

    const relatedTables = new Set();
    const fkColumns = new Set();

    for (const row of rows) {
      relatedTables.add(row.source_table);
      relatedTables.add(row.target_table);
      fkColumns.add(`${row.source_table}.${row.source_column}`);
      fkColumns.add(`${row.target_table}.${row.target_column}`);
    }

    // Get primary key columns  tc.constraint_type = 'PRIMARY KEY'       AND
    const pkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE  tc.table_name = ANY($1);
    `;

    const pkResult = await pool.query(pkQuery, [[...relatedTables]]);
    const pkColumns = new Set();
    pkResult.rows.forEach((row) => {
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

    columnResult.rows.forEach((row) => {
      const key = `${row.table_name}.${row.column_name}`;
      if (!pkColumns.has(key) && !fkColumns.has(key)) {
        if (!columnsByTable[row.table_name]) {
          columnsByTable[row.table_name] = [];
        }
        columnsByTable[row.table_name].push({
          column_name: row.column_name,
          data_type: row.data_type,
        });
      }
    });

    res.json({ relatedTables: [...relatedTables], columnsByTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function PreviewReport(req, res, next) {
  const {
    report_name,
    tableandview = [],
    selectedcolumns = [],
    xyaxis = [],
    filters = [],
    sortby = [],
    groupby = [],
    fieldtype,
  } = req.body;

  //console.log(req.body);

  try {
    if (fieldtype && fieldtype.toLowerCase() === "summary") {
      if (selectedcolumns.length === 0) {
        return next({
          status: 400,
          message: `Select Column to view in reprot`,
          error: "Column validation failed.",
        });
      }
    } else if (fieldtype.toLowerCase() === "count") {
      if (xyaxis.length === 0) {
        return next({
          status: 400,
          message: `Select X-Y Axis Configuration to View`,
          error: "Column validation failed.",
        });
      }
    }

    // 1. Validate table list
    const tableResult = await pool.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `,
      [tableandview]
    );

    const foundTables = tableResult.rows.map((row) => row.table_name);
    const missingTables = tableandview.filter((t) => !foundTables.includes(t));

    if (missingTables.length > 0) {
      return next({
        status: 400,
        message: `The following tables do not exist: ${missingTables.join(
          ", "
        )}`,
        error: "Table validation failed.",
      });
    }

    // 2. Check foreign key relationships among tables
    const relResult = await pool.query(
      `
          SELECT
            conrelid::regclass::text AS source_table,
            confrelid::regclass::text AS target_table
          FROM pg_constraint
          WHERE contype = 'f'
            AND conrelid::regclass::text = ANY($1)
            AND confrelid::regclass::text = ANY($1)
        `,
      [tableandview]
    );

    //console.log(relResult.rows);
    const relatedPairs = new Set(
      relResult.rows.map((row) =>
        [row.source_table, row.target_table].sort().join(",")
      )
    );

    if (relatedPairs.size === 0 && tableandview.length > 1) {
      return next({
        status: 400,
        message: `The selected tables are not related to each other.`,
        error: "Table relationship validation failed.",
      });
    }

    // 2. Fetch columns for all tables
    const colResult = await pool.query(
      `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `,
      [tableandview]
    );

    // Build a lookup: table.column => data_type
    const columnMap = new Map();
    colResult.rows.forEach((row) => {
      columnMap.set(`${row.table_name}.${row.column_name}`, row.data_type);
    });

    // 3. Validate selectedColumns (e.g. ["orders.date", "users.name"])
    const invalidColumns = selectedcolumns.filter((col) => !columnMap.has(col));
    if (invalidColumns.length > 0) {
      return next({
        status: 400,
        message: `Invalid selected columns: ${invalidColumns.join(", ")}`,
        error: "Invalid column selection.",
      });
    }

    // 4. Validate filters
    for (const [i, filter] of filters.entries()) {
      const { field, operator, value, valueFrom, valueTo } = filter;

      if (!field) {
        return next({
          status: 400,
          message: `Filter at index ${i}: 'field' is required.`,
          error: "Missing filter field.",
        });
      }

      if (!columnMap.has(field)) {
        return next({
          status: 400,
          message: `Invalid filter column: ${field}`,
          error: "Invalid column in filter.",
        });
      }

      if (!operator) {
        return next({
          status: 400,
          message: `Filter at index ${i}: 'operator' is required.`,
          error: "Missing operator.",
        });
      }

      if (operator === "between") {
        if (valueFrom == null || valueTo == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`,
            error: "Missing range values.",
          });
        }
      } else {
        if (value == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'value' is required for operator '${operator}'.`,
            error: "Missing filter value.",
          });
        }

        const valueAsNumber =
          typeof value === "string" && !isNaN(Number(value))
            ? Number(value)
            : value;
        const expectedType = await mapDbTypeToJsType(columnMap.get(field));
       // console.log("Expected type:", expectedType);
        let actualType = typeof valueAsNumber;
       // console.log("Actual type:", actualType);

        if (expectedType === "string" && actualType === "number") {
          // value = String(value);
          actualType = "string";
        }

        if (expectedType !== actualType) {
          return next({
            status: 400,
            message: `Filter at index ${i}: Type mismatch for column "${field}": expected ${expectedType}, got ${actualType}`,
            error: "Type mismatch in filter.",
          });
        }
      }
    }

    // 5. Validate sortBy and groupBy
    const badSort = sortby.filter((col) => !columnMap.has(col.field));
    if (badSort.length > 0) {
      return next({
        status: 400,
        message: `Invalid sort columns: ${badSort
          .map((c) => c.field)
          .join(", ")}`,
        error: "Invalid sort selection.",
      });
    }

    // ✅ 3. Check if groupby columns are also included in selectedColumns
    const selectedColumnSet = new Set(selectedcolumns);
    const missingInSelect = groupby
      .map((col) => col.field)
      .filter((field) => !selectedColumnSet.has(field));

    if (missingInSelect.length > 0) {
      return next({
        status: 400,
        message: `Group by columns must be selected: ${missingInSelect.join(
          ", "
        )}`,
        error: "Invalid group selection.",
      });
    }

    // groyup by
    const badGroup = groupby.filter((col) => !columnMap.has(col.field));
    if (badGroup.length > 0) {
      return next({
        status: 400,
        message: `Invalid group columns: ${badGroup
          .map((c) => c.field)
          .join(", ")}`,
        error: "Invalid group selection.",
      });
    }

    // 6. Build config

    const config = {
      tables: tableandview,
      fieldtype,
      selection: selectedcolumns,
      filters: filters.map((f) => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo,
      })),
      groupBy: groupby.map((g) => ({ field: g.field })),
      sortBy: sortby.map((col) => ({
        column: col.field,
        order: col.direction,
      })),
      xyaxis: xyaxis.map((axis) => ({
        x: {
          field: axis.xAxisField,
          order: axis.xAxisDirection,
          transformation: axis.xAxisTransformation || "raw", // Handle transformation, default to "raw"
        },
        y: {
          field: axis.yAxisField,
          order: axis.yAxisDirection,
          aggregation: axis.yAxisAggregation || "count", // Handle aggregation, default to "sum"
        },
      })),
    };

    // 7. Execute business logic
    const data = await Executionfunction(config);
 
    let chartData;
    res.json({ message: "Validation passed", data, chartData });
  } catch (err) {
    next(err);
  }
}

async function ListReport(req, res) {
  try {
    const result = await pool.query(
      `SELECT *,report_id,report_name,table_name as tableandView,selected_columns as selectedColumns,filter_criteria as filters,group_by as groupBy,sort_order as sortBy FROM report_configuration`
    );
    res.json({ reports: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function GetReportById(req, res) {
  try {
    const reportId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM report_configuration WHERE report_id = $1`,
      [reportId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function SaveReportConfiguration(req, res) {
  try {
    const {
      reportname,  userId,  fieldtype,  tableandview = [],xyaxis = [], selectedcolumns = [],   filters = [],
      sortby = [],  groupby = [], } = req.body;

    const reportId = req.params.id;
    if (!reportname) {
      return res
        .status(400)
        .json({ error: "Report name and configuration are required" });
    }

    let result;
    if (reportId != 0) {
      result = await pool.query(
        `
      UPDATE report_configuration 
      SET user_id = $1,
          report_name = $2,
          table_name = $3,
          selected_columns = $4,
          filter_criteria = $5,
          group_by = $6,
          sort_order = $7,
          axis_config = $8,
          fieldtype = $10
      WHERE report_id = $9
       
      RETURNING report_id;
    `,
        [
          0,
          reportname,
          tableandview,
          selectedcolumns,
          filters,
          groupby,
          sortby,
          xyaxis,
          reportId,
          fieldtype,
        ]
      );
    } else {
      result = await pool.query(
        `
      INSERT INTO report_configuration (
        user_id,
        report_name,
        table_name,
        selected_columns,
        filter_criteria,
        group_by,
        sort_order,
        axis_config,
                  fieldtype  
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)
      RETURNING report_id;
    `,
        [
          0,
          reportname,
          tableandview, // table_name expects Text[]
          selectedcolumns, // selected_columns expects Text[]
          filters, // JSONB[]
          groupby, // JSONB[]
          sortby, // JSONB[]
          xyaxis, // JSONB[]
          fieldtype,
        ]
      );
    }

    const reportIds = result.rows[0].report_id;

    res
      .status(200)
      .json({ message: "Report Save Successfully", id: reportIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listTablesAndViews,
  CheckRelationAndListOfColumn,
  PreviewReport,
  ListReport,
  GetReportById,
  SaveReportConfiguration,
};
