const express = require('express');
const router = express.Router();
const {  listTablesAndViews,  listColumnsByTable, ViewDataForPreview , SaveReportConfiguration} = require('../controller/metadata.controller.js');

// Get All tables and view first
router.get('/tables', listTablesAndViews);

// get link tables and their column 
router.get('/check-table-relations', listColumnsByTable);

// get column for views
router.post('/columns/:tableName', ViewDataForPreview);

// Final View for reprot and chart
router.post('/report/preview', SaveReportConfiguration);

// list page for view all list of save report format 
router.post('/List-Report', SaveReportConfiguration);

// Get preview from list page based on id
router.post('/report/:id', SaveReportConfiguration);

// save and update save report config
router.post('/report/save/:id', SaveReportConfiguration);
module.exports = router;
