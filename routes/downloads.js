var express = require('express');
var router = express.Router();

/* GET downloads listing. */
router.get('/', function (req, res, next) {
    var fileName = req.query.fileName || "";
    var path = req.query.path? req.query.path +"/": "";
    var filePath = "views/md/" + path + fileName;
    res.download(filePath, fileName);
});

module.exports = router;
