const express = require('express');
const router = express.Router();
const {  listTablesAndViews,  listColumnsByTable, ViewDataForPreview} = require('../controller/metadata.controller.js');

router.get('/tables', listTablesAndViews);
router.get('/columns/:tableName', listColumnsByTable);
//router.post('/preview', ViewDataForPreview);
module.exports = router;
