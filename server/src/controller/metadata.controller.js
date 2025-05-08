const { getTablesAndViews, getColumnMetadata, getData } = require('../models/metadata.model');

async function listTablesAndViews(req, res) {
  try {
    const data = await getTablesAndViews();
    res.json(data);
  } catch (err) {
    console.error('Error fetching tables/views:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function listColumnsByTable(req, res) {
  const tableName = req.params.tableName;

  if (!tableName) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    const columns = await getColumnMetadata(tableName);
    res.json(columns);
  } catch (err) {
    console.error(`Error fetching columns for table "${tableName}":`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function ViewDataForPreview(req, res) {

  console.log(req.body);
  const { tableName, selectedColumns } = req.body;


  if (!tableName || !selectedColumns) {
    return res.status(400).json({ error: 'Table name and selected columns are required' });
  }


  try {
    const data = getData(tableName, selectedColumns);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching columns for table "${tableName}":`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = {
  listTablesAndViews,
  listColumnsByTable,
  ViewDataForPreview
};
