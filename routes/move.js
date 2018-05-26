var express = require('express');
var router = express.Router();
const StringUtils = require('../core/util/StringUtils');
const moveService = require('../core/service/moveService');
const actorService = require('../core/service/actorService');
const moveDownloadService = require('../core/service/moveDownloadService');
const moveUrlService = require('../core/service/moveUrlService');

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
    res.render('detail', {
        title: '电影',
        msg: "",
        move: moves.data[0],
        moveUrls: moveUrls.data,
        downloads: downloads.data,
        actors: actors.data,
        user: req.session.user,
        active: "/"
    });
});
router.get('/play', async function (req, res, next) {
    var move_id = req.query.move_id;
    var player = req.query.player;
    var moves = await moveService.findOne(move_id);
    var move = moves.data[0] || {};
    if (moves.data[0]['name']) {
        move.description = StringUtils.htmlDecodeByRegExp(moves.data[0]['description']);
    }
    var actors = await actorService.findActorByMoveId(move_id);
    var moveUrls = await moveUrlService.findMoveUrl(move_id);
    var downloads = await moveDownloadService.findDownloadUrl(move_id);
    var currentMoveUrls = await moveUrlService.findMoveUrlByMoveIdAndPlayer(move_id, player);
    console.log(currentMoveUrls);
    var template = "online_play";
    /*if (player == "西瓜影音") {
        template = "xigua_play";
    }*/
    res.render(template, {
        title: '电影',
        msg: "",
        move: moves.data[0],
        currentMoveUrls: currentMoveUrls.data[0],
        moveUrls: moveUrls.data,
        downloads: downloads.data,
        actors: actors.data,
        user: req.session.user,
        active: "/"
    });
});
module.exports = router;
