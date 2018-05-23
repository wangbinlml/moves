const express = require('express');
const mysql = require('../core/mysql');
const router = express.Router();
const moveService = require('../core/service/moveService');
/* GET home page. */
router.get('/', async function (req, res, next) {
    var current_page = req.query.page;
    var moves = await moveService.findAll(current_page);
    console.log(moves);
    res.render('index', {
        title: '电影',
        msg: "",
        user: req.session.user,
        active: "/"
    });
});
module.exports = router;
