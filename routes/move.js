var express = require('express');
var router = express.Router();
const StringUtils = require('../core/util/StringUtils');
const moveService = require('../core/service/moveService');
const actorService = require('../core/service/actorService');
const moveDownloadService = require('../core/service/moveDownloadService');
const moveUrlService = require('../core/service/moveUrlService');
const categoryService = require('../core/service/categoryService');


router.get('/', async function (req, res, next) {
    var category_id = req.query.category_id || "1";
    var current_page = req.query.current_page || "1";
    var moves = {};
    var title = "电影";
    if (category_id != "") {
        var category = await categoryService.findCategory(category_id);
        if(category && category.data.length > 0){
            title = category.data[0].name;
        }
        var data = await moveService.findAllMoves(category_id, current_page, 30);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i<paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.replace(/<\/?.+?>/g,"").replace(/<\/?.+?>/g,"");
            description = description.length > 30 ? description.substr(30)+"..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    res.render("moves", {
        title: title,
        category_id: category_id,
        msg: "",
        moves: moves,
        areas: areas,
        user: req.session.user,
        active: category_id
    });
});
router.get('/detail', async function (req, res, next) {
    var move_id = req.query.move_id;
    var moves = await moveService.findOne(move_id);
    var move = moves.data[0] || {};
    if (moves.data[0]['name']) {
        move.description = StringUtils.htmlDecodeByRegExp(moves.data[0]['description']);
    }
    var actors = await actorService.findActorByMoveId(move_id);
    var moveUrls = await moveUrlService.findMoveUrl(move_id);
    var downloads = await moveDownloadService.findDownloadUrl(move_id);
    var areas = await moveService.findAllArea();
    res.render('detail', {
        title: move.name || '电影',
        msg: "",
        move: moves.data[0],
        moveUrls: moveUrls.data,
        downloads: downloads.data,
        actors: actors.data,
        user: req.session.user,
        areas: areas,
        active: "/"
    });
});
router.get('/play', async function (req, res, next) {
    var move_id = req.query.move_id;
    var player = req.query.player || '在线播放';
    var moves = await moveService.findOne(move_id);
    var move = moves.data[0] || {};
    if (moves.data[0]['name']) {
        move.description = StringUtils.htmlDecodeByRegExp(moves.data[0]['description']);
    }
    var actors = await actorService.findActorByMoveId(move_id);
    var moveUrls = await moveUrlService.findMoveUrl(move_id);
    var downloads = await moveDownloadService.findDownloadUrl(move_id);
    var currentMoveUrls = await moveUrlService.findMoveUrlByMoveIdAndPlayer(move_id, player);
    var template = "online_play";
    if (player == "西瓜影音") {
        template = "xigua_play";
    }
    var areas = await moveService.findAllArea();
    res.render(template, {
        title:  move.name || '电影',
        msg: "",
        move: moves.data[0],
        currentMoveUrls: currentMoveUrls.data[0],
        moveUrls: moveUrls.data,
        downloads: downloads.data,
        actors: actors.data,
        user: req.session.user,
        areas: areas,
        active: "/"
    });
});
router.get('/search', async function (req, res, next) {
    var keyword = req.query.keyword || "";
    var current_page = req.query.current_page || "1";
    var moves = [];
    if (keyword != "") {
        var data = await moveService.search(keyword, current_page, 10);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i<paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name.replace(keyword,"<font color='red'>"+keyword+"</font>");
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.replace(/<\/?.+?>/g,"").replace(/<\/?.+?>/g,"");
            description = description.length > 30 ? description.substr(30)+"..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    res.render("search", {
        title: '搜索',
        keyword: keyword,
        msg: "",
        moves: moves,
        areas: areas,
        user: req.session.user,
        active: "/"
    });
});
router.get('/area', async function (req, res, next) {
    var area = req.query.area || "";
    var current_page = req.query.current_page || "1";
    var moves = [];
    if (area != "") {
        var data = await moveService.findMovesByArea(area, current_page, 18);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i<paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.length > 30 ? description.substr(30)+"..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    res.render("area", {
        title: area,
        areas: areas,
        area: area,
        msg: "",
        moves: moves,
        user: req.session.user,
        active: "/"
    });
});
router.get('/player_show', async function (req, res, next) {
    res.render("player_show", {
    });
});
module.exports = router;
