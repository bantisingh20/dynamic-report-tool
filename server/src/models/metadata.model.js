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


async function SaveUpdate(fieldType,reportId,table, reportName, columns, userId, filterCriteria, groupBy, sortOrder, axisConfig) {

  console.log(reportId);
  let result;
  if(reportId != 0){
   result = await pool.query(`
      UPDATE report_configuration 
      SET user_id = $1,
          report_name = $2,
          table_name = $3,
          selected_columns = $4,
          filter_criteria = $5,
          group_by = $6,
          sort_order = $7,
          axis_config = $8
          fieldType = $10
      WHERE report_id = $9
       
      RETURNING report_id;
    `, [
      0,
      reportName,
      table,
      columns,        
      filterCriteria,  
      groupBy,            
      sortOrder,          
      axisConfig,
      reportId  ,
      fieldType 
    ]);
  }
  else{
   result = await pool.query(`
      INSERT INTO report_configuration (
        user_id,
        report_name,
        table_name,
        selected_columns,
        filter_criteria,
        group_by,
        sort_order,
        axis_config,
                  fieldType  
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)
      RETURNING report_id;
    `, [
      0,
      reportName,
       table,              // table_name expects Text[]
  columns,            // selected_columns expects Text[]
  filterCriteria,     // JSONB[]
  groupBy,            // JSONB[]
  sortOrder,          // JSONB[]
  axisConfig          // JSONB[]
  ,fieldType
    ]);
  }
  
    const reportIds = result.rows[0].report_id;

  
   return reportIds;
   
}


module.exports = {
  getTablesAndViews,
  getColumnMetadata,
  getData,
  SaveUpdate
};
