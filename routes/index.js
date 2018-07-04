const express = require('express');
const mysql = require('../core/mysql');
const router = express.Router();
const moveService = require('../core/service/moveService');
const tagService = require('../core/service/tagService');
/* GET home page. */
router.get('/', async function (req, res, next) {
    var current_page = req.query.page;
    var moves = await moveService.findAll(current_page,18);
    var dongzuo = await moveService.findMoves(1, current_page,18);
    var kehuan = await moveService.findMoves(2, current_page,18);
    var juqing = await moveService.findMoves(3, current_page,18);
    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();
    res.render('index', {
        title: '最新电影',
        msg: "",
        areas: areas,
        tags: tags,
        moves: moves.data.data,
        dongzuo: dongzuo.data.data,
        kehuan: kehuan.data.data,
        juqing: juqing.data.data,
        user: req.session.user,
        active: "/"
    });
});
module.exports = router;
