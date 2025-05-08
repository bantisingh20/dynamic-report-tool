const pool = require('../config/db.js');

async function getTablesAndViews() {
  // const result = await pool.query(`
  //   SELECT table_name, table_type
  //   FROM information_schema.tables
  //   WHERE table_schema = 'public'
     
  //     AND (table_type = 'BASE TABLE' OR table_type = 'VIEW')
  //   ORDER BY table_name;
  // `);
  const result = await pool.query('SELECT * FROM spGetAllTables_And_Views();');

  return result.rows.map(row => ({
    name: row.table_name,
    type: row.type// === 'BASE TABLE' ? 'table' : 'view'
  }));
}

async function getColumnMetadata(tableName) {
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `,
    [tableName]
  );

  return result.rows.map(row => row.column_name);
}

async function getData(tableName, selectedColumns) {

  console.log(selectedColumns);
  // const columns = selectedColumns.map(col => col.columns).flat().join(', ');

   const query = `SELECT ${selectedColumns} FROM ${tableName}`
   console.log(query);
   const res = await pool.query(query);
 
   return res.rows;
   
}

module.exports = {
  getTablesAndViews,
  getColumnMetadata,
  getData
};
