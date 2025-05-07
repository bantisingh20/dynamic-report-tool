const express = require('express');
const router = express.Router();
const {  listTablesAndViews,  listColumnsByTable} = require('../controller/metadata.controller.js');

router.get('/tables', listTablesAndViews);
router.get('/columns/:tableName', listColumnsByTable);

module.exports = router;
