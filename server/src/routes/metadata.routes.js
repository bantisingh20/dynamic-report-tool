const express = require('express');
const router = express.Router();
const {  listTablesAndViews,  listColumnsByTable, ViewDataForPreview , SaveReportConfiguration} = require('../controller/metadata.controller.js');

router.get('/tables', listTablesAndViews);
router.get('/columns/:tableName', listColumnsByTable);
router.post('/preview', ViewDataForPreview);
router.post('/save', SaveReportConfiguration);
module.exports = router;
