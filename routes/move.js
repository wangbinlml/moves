var express = require('express');
var _ = require('lodash');
var router = express.Router();
const StringUtils = require('../core/util/StringUtils');
const moveService = require('../core/service/moveService');
const actorService = require('../core/service/actorService');
const moveDownloadService = require('../core/service/moveDownloadService');
const moveUrlService = require('../core/service/moveUrlService');
const categoryService = require('../core/service/categoryService');
const tagService = require('../core/service/tagService');

router.get('/', async function (req, res, next) {
    var category_id = req.query.category_id || "1";
    var current_page = req.query.current_page || "1";
    var moves = {};
    var title = "电影";
    if (category_id != "") {
        var category = await categoryService.findCategory(category_id);
        if (category && category.data.length > 0) {
            title = category.data[0].name;
        }
        var data = await moveService.findAllMoves(category_id, current_page, 30);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i < paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.replace(/<\/?.+?>/g, "").replace(/<\/?.+?>/g, "");
            description = description.length > 30 ? description.substr(30) + "..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();
    res.render("moves", {
        title: title,
        category_id: category_id,
        msg: "",
        moves: moves,
        areas: areas,
        tags: tags,
        user: req.session.user,
        active: category_id
    });
});
router.get('/list', async function (req, res, next) {
    var category_id = req.query.category_id || "1";
    var current_page = req.query.current_page || "1";
    var moves = {};
    var title = "电影";
    if (category_id != "") {
        var category = await categoryService.findCategory(category_id);
        if (category && category.data.length > 0) {
            title = category.data[0].name;
        }
        var data = await moveService.findAllMoves(category_id, current_page, 30);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i < paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.replace(/<\/?.+?>/g, "").replace(/<\/?.+?>/g, "");
            description = description.length > 30 ? description.substr(30) + "..." : description;
            paginObj.description = description;

            var tag_id = paginObj.tag_id;
            var tag_name = "未知";
            var tags = await tagService.findTagById(tag_id);
            if (tags && tags['data'].length > 0) {
                tag_name = tags['data'][0]['tag_name'];
            }
            paginObj.tag_name = tag_name;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    res.status(200).json(moves);
});
router.get('/detail', async function (req, res, next) {
    var move_id = req.query.move_id;
    var moves = await moveService.findOne(move_id);
    var move = moves.data[0];
    if (move) {
        if (moves.data[0]['name']) {
            move.description = StringUtils.htmlDecodeByRegExp(moves.data[0]['description']);
        }
        var actors = await actorService.findActorByMoveId(move_id);
        var moveUrls = await moveUrlService.findMoveUrl(move_id);
        var downloads = await moveDownloadService.findDownloadUrl(move_id);
        var areas = await moveService.findAllArea();
        var tags = await tagService.findTags();
        var tagID = "";
        if (!_.isEmpty(move)) {
            var tag_id = move.tag_id;
            tagID = tag_id;
            var current_tags = await tagService.findTagById(tag_id);
            if (current_tags && current_tags['data'].length > 0) {
                move.tag_id = current_tags['data'][0]['tag_name'];
            } else {
                move.tag_id = "未知";
            }
        } else {
            move.tag_id = "未知";
        }
        //获取相关视频
        var relation_list = await moveService.findRelationMoves(tagID, move.area, 18);
        //浏览量最多的视频
        var mostViews = await moveService.findMostViewsMoves(tagID, move.area, 18);
        var urls = moveUrls.data;
        var playerList = [];
        var exists = {};
        var rlist = [];
        var list = [];
        var len = urls.length;
        for (var i = 0; i < urls.length; i++) {
            var urlObj = urls[i];
            var player = urlObj.player;
            if (exists[urlObj.player] == undefined) {
                list = [];
                exists[urlObj.player] = player;
                playerList.push(player);
                list.push(urlObj);
                rlist.push(list);
            } else {
                list.push(urlObj);
            }
        }
        var result = [];
        for (var i = 0; i < playerList.length; i++) {
            var player = playerList[i];
            result.push({
                player: player,
                list: rlist[i]
            });
        }
        res.render('detail', {
            title: move.name || '电影',
            msg: "",
            move: move,
            relation_list: relation_list || [],
            mostViews: mostViews || [],
            result: result,
            downloads: downloads.data,
            actors: actors.data,
            user: req.session.user,
            areas: areas,
            tags: tags,
            active: "/"
        });
    } else {
        let err = new Error('Not Found');
        err.status = 404;
        res.render('404');
    }
});
router.get('/play', async function (req, res, next) {
    var move_id = req.query.move_id;
    var id = req.query.id;
    var player = req.query.player || '在线播放';
    var moves = await moveService.findOne(move_id);
    var move = moves.data[0] || {};
    if (moves.data[0]['name']) {
        move.description = StringUtils.htmlDecodeByRegExp(moves.data[0]['description']);
    }
    var actors = await actorService.findActorByMoveId(move_id);
    var moveUrls = await moveUrlService.findMoveUrl(move_id);
    var downloads = await moveDownloadService.findDownloadUrl(move_id);
    var currentMoveUrls = await moveUrlService.findMoveUrlByMoveIdAndPlayer(id, move_id, player);
    var tagID = "";
    if (!_.isEmpty(move)) {
        var tag_id = move.tag_id;
        tagID = tag_id;
        var tags = await tagService.findTagById(tag_id);
        if (tags && tags['data'].length > 0) {
            move.tag_id = tags['data'][0]['tag_name'];
        } else {
            move.tag_id = "未知";
        }
    } else {
        move.tag_id = "未知";
    }
    currentMoveUrls = currentMoveUrls.data[0];
    var template = "player/online_play";
    player = player.trim();
    if (player.indexOf("西瓜影音") >= 0 || currentMoveUrls.url.indexOf(".rmvb") > 0) {
        template = "player/xigua_play";
    } else if (player == "iframe") {
        template = "player/iframe";
    } else if (player.indexOf("优酷") >= 0 || player.indexOf("youku") >= 0) {
        template = "player/youku_play";
    } else if (player.indexOf("土豆") >= 0) {
        template = "player/tudou_play";
    } else if (player.indexOf("乐视") >= 0) {
        template = "player/letv_play";
    } else if (player.indexOf("酷6") >= 0) {
        template = "player/ku6_play";
    } else if (player.indexOf("腾讯") >= 0 || player.indexOf("qq") >= 0) {
        template = "player/qq_play";
    } else if (player.indexOf("搜狐") >= 0) {
        template = "player/souhu_play";
    } else if (player.indexOf("爱奇艺") >= 0 || player.indexOf("qiyi") >= 0 || player.indexOf("iqiyi") >= 0) {
        template = "player/iqiyi_play";
    } else if (player.indexOf("Bilibili") >= 0) {
        template = "player/bilibili_play";
    } else if (player.indexOf("mp4") >= 0) {
        template = "player/mp4_play";
    } else if (player.indexOf("芒果") >= 0 || player.indexOf("mgtv") >= 0) {
        template = "player/mangguo_play";
    } else if (player.indexOf("AcFun视频") >= 0 || player.indexOf("AcFun") >= 0) {
        template = "player/acfun_play";
    }else if (player.indexOf("pptv") >= 0 || player.toLocaleLowerCase().indexOf("pptv") >= 0) {
        template = "player/pptv_play";
    }

    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();

    //获取相关视频
    var relation_list = await moveService.findRelationMoves(tagID, move.area, 18);
    //浏览量最多的视频
    var mostViews = await moveService.findMostViewsMoves(tagID, move.area, 18);

    var urls = moveUrls.data;
    var playerList = [];
    var exists = {};
    var rlist = [];
    var list = [];
    var len = urls.length;
    for (var i = 0; i < urls.length; i++) {
        var urlObj = urls[i];
        var player = urlObj.player;
        if (exists[urlObj.player] == undefined) {
            list = [];
            exists[urlObj.player] = player;
            playerList.push(player);
            list.push(urlObj);
            rlist.push(list);
        } else {
            list.push(urlObj);
        }
    }
    var result = [];
    for (var i = 0; i < playerList.length; i++) {
        var player = playerList[i];
        result.push({
            player: player,
            list: rlist[i]
        });
    }
    res.render(template, {
        title: move.name || '电影',
        msg: "",
        move: move,
        relation_list: relation_list || [],
        mostViews: mostViews || [],
        currentMoveUrls: currentMoveUrls,
        result: result,
        downloads: downloads.data,
        actors: actors.data,
        user: req.session.user,
        areas: areas,
        tags: tags,
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
        for (var i = 0; i < paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name.replace(keyword, "<font color='red'>" + keyword + "</font>");
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.replace(/<\/?.+?>/g, "").replace(/<\/?.+?>/g, "");
            description = description.length > 30 ? description.substr(30) + "..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();
    res.render("search", {
        title: '搜索',
        keyword: keyword,
        msg: "",
        moves: moves,
        areas: areas,
        tags: tags,
        user: req.session.user,
        active: "/"
    });
});
router.get('/area', async function (req, res, next) {
    var area = req.query.area || "";
    var current_page = req.query.current_page || "1";
    var moves = [];
    if (area != "") {
        var data = await moveService.findMovesByArea(area, current_page, 30);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i < paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.length > 30 ? description.substr(30) + "..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();
    res.render("area", {
        title: area,
        tags: tags,
        areas: areas,
        area: area,
        msg: "",
        moves: moves,
        user: req.session.user,
        active: "/"
    });
});
router.get('/tags', async function (req, res, next) {
    var tag_id = req.query.tag_id || "";
    var tag_name = req.query.tag_name || "";
    var current_page = req.query.current_page || "1";
    var moves = [];
    if (tag_id != "") {
        var data = await moveService.findMovesByTagId(tag_id, current_page, 30);
        var paginationObj = data.data;
        var paginationData = paginationObj.data;
        var pData = [];
        for (var i = 0; i < paginationData.length; i++) {
            var paginObj = paginationData[i];
            paginObj.name = paginObj.name;
            var description = StringUtils.htmlDecodeByRegExp(paginObj['description']);
            description = description.length > 30 ? description.substr(30) + "..." : description;
            paginObj.description = description;
            pData.push(paginObj);
        }
        paginationObj.data = pData;
        data.data = paginationObj;
        moves = paginationObj;
    }
    var areas = await moveService.findAllArea();
    var tags = await tagService.findTags();
    res.render("tags", {
        title: tag_name,
        tag_id: tag_id,
        tag_name: tag_name,
        areas: areas,
        tags: tags,
        msg: "",
        moves: moves,
        user: req.session.user,
        active: "1"
    });
});
router.get('/player_show', async function (req, res, next) {
    res.render("player_show", {});
});
module.exports = router;
