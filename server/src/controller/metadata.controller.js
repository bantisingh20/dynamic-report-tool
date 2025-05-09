const { getTablesAndViews, getColumnMetadata, getData,SaveUpdate } = require('../models/metadata.model');

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
 
  const { tableName, selectedColumns } = req.body;

  if (!tableName || !selectedColumns) {
    return res.status(400).json({ error: 'Table name and selected columns are required' });
  }

  try {
    const data = await getData(tableName, selectedColumns);
    console.log(data);
    res.json(data);

 
  } catch (err) {
    console.error(`Error fetching columns for table "${tableName}":`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function SaveReportConfiguration(req, res) {
  const { table, reportName, columns, userId, filterCriteria, groupBy, sortOrder, axisConfig } = req.body;
 
  if (!table || !columns ) {
    console.log('userid')
    return res.status(400).json({ error: 'Table name, selected columns, and user ID are required' });
  }

  try {
 
    const data = await SaveUpdate(table, reportName, columns, userId, filterCriteria, groupBy, sortOrder, axisConfig);
    
   const reportId = data;
    res.status(201).json({ message: 'Report configuration saved successfully', reportId });
  } catch (err) {
    console.error('Error saving report configuration:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = {
  listTablesAndViews,
  listColumnsByTable,
  ViewDataForPreview,
  SaveReportConfiguration
};
