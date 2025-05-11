const pool = require('../config/db.js');

async function getTablesAndViews() {
  const result = await pool.query('SELECT * FROM list_tables_and_views();');
 
  return result.rows.map(row => ({
    name: row.name,
    type: row.type
  }));
}

async function getColumnMetadata(tableName) {
  const result = await pool.query(
    `
    SELECT column_name,data_type
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `,
    [tableName]
  );

  return result.rows.map(row => ({  column_name: row.column_name,  data_type: row.data_type}));

}

async function getData(tableName, selectedColumns) {
  //console.log(selectedColumns);  // const columns = selectedColumns.map(col => col.columns).flat().join(', ');

  console.log(selectedColumns);

  if(selectedColumns == null){
    selectedColumns = "*";
  }
   const query = `SELECT ${selectedColumns} FROM ${tableName}` 
   const res = await pool.query(query);

   return res.rows;
   
}


async function SaveUpdate(table, reportName, columns, userId, filterCriteria, groupBy, sortOrder, axisConfig) {

  const query = `
      INSERT INTO report_configuration (
        user_id,
        report_name,
        table_name,
        selected_columns,
        filter_criteria,
        group_by,
        sort_order,
        axis_config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING report_id;
    `;

    const result = await pool.query(query, [
      0,
      reportName,
      table,
      columns,        
      JSON.stringify(filterCriteria),  
      groupBy,            
      sortOrder,          
      JSON.stringify(axisConfig),   
    ]);

    const reportId = result.rows[0].report_id;

  //  const query = `SELECT ${selectedColumns} FROM ${tableName}` 
  //  const res = await pool.query(query);

   return reportId;
   
}
module.exports = {
  getTablesAndViews,
  getColumnMetadata,
  getData,
  SaveUpdate
};
