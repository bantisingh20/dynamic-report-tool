const express = require('express');
const router = express.Router();
const {  listTablesAndViews,PreviewReport,  CheckRelationAndListOfColumn , SaveReportConfiguration, ListReport, GetReportById} = require('../controller/metadata.controller.js');

router.get('/', (req, res) => {
  res.json({ message: 'Metadata API working!' });
});

//list page
router.get('/List-Report', ListReport); 
router.get('/report/:id', GetReportById);

//submit 
router.get('/tables',listTablesAndViews);
router.post('/check-table-relations', CheckRelationAndListOfColumn);
router.post('/report/preview', PreviewReport);
router.post('/report/save/:id', SaveReportConfiguration);

module.exports = router;
