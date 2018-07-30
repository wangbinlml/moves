//依赖模块
var fs = require('fs');
var logger = require('../core/logger').getLogger("system");
var querystring = require('querystring');
var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var utils = require("../core/util/utils");
var StringUtils = require("../core/util/StringUtils");
var httpUtils = require("../core/util/HttpUtils");
var mysql = require("../core/mysql");
var actorService = require("../core/service/actorService");
var categoryService = require("../core/service/categoryService");
var moveActorService = require("../core/service/moveActorService");
var moveDownloadService = require("../core/service/moveDownloadService");
var moveService = require("../core/service/moveService");
var moveTagService = require("../core/service/moveTagService");
var moveUrlService = require("../core/service/moveUrlService");
var tagService = require("../core/service/tagService");
var pageService = require("../core/service/pageService");
var base_url = "http://www.yezitu.cc";
var schedule = require("node-schedule");

var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var page = 1;//pageObj.data[0]['page'];
        var url = "http://www.yezitu.cc/list/?1-" + page + ".html";
        logger.info("url: " + url);
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('.hy-video-list ul li');
        for (var i = 0; i < data.length; i++) {
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var dt = data[i];
                var href = dt.children[0].attribs.href;
                var imgs = dt.children[0].attribs.style;
                var src = imgs.substring(imgs.indexOf("(") + 1, imgs.indexOf(")"));
                var hd = dt.children[0].children[1].children[0].data;
                var title = dt.children[1].children[0].children[0].children[0].data + (hd ? "-" + hd : "");
                logger.info("=====第" + page + "_" + i + "条======");
                var movelist = await moveService.findMoveByName(title);
                var exits = false;
                if (movelist && movelist.data.length > 0) {
                    logger.info("===" + title + "已经存在里");
                    exits = true;
                }
                var moveObj = {
                    category_id: 1,
                    tag_id: 3,
                    name: title,
                    cover: src,
                    source: "",
                    description: "",
                    creator_id: 1
                };
                var actors = [];
                var type = "";//类型：动作片，剧情片
                var year = "";//年代
                var area = "";//区域
                var content = "";
                var playList = [];

                var detail_url = base_url + href;
                var detail_html = await utils.get(detail_url);
                var $2 = cheerio.load(detail_html, {decodeEntities: false});
                var detail_li = $2('.hy-video-details .content').find(".score").find("li");
                detail_li.each(function (index, item) {
                    var $li2 = $(this);
                    if (index == 0) {
                        //主演
                        var actorsA = $li2.find('a');
                        actorsA.each(function (indexA, itemA) {
                            var $liA = $(this);
                            actors.push($liA.text());
                        });
                    } else if (index == 1) {
                        //导演
                    } else if (index == 2) {
                        //地区
                        area = ($li2.text() + "").replace(/地区：/g, "");
                    } else if (index == 3) {
                        //类型
                        type = ($li2.text() + "").replace(/类型：/g, "");
                    } else if (index == 5) {
                        //年份
                        year = ($li2.text() + "").replace(/年份：/g, "");
                    }
                });
                if (type == "动作片") {
                    moveObj.tag_id = 1;
                } else if (type == "科幻片") {
                    moveObj.tag_id = 2;
                } else if (type == "剧情片") {
                    moveObj.tag_id = 3;
                } else if (type == "喜剧片") {
                    moveObj.tag_id = 4;
                } else if (type == "恐怖片") {
                    moveObj.tag_id = 5;
                }

                moveObj.area = area;
                moveObj.year = year;
                var flag = true;
                var playlist = $2('.tab-content').find(".playlist");
                var playLinks = playlist.find("a");
                var linkP = [];
                playLinks.each(function (plindex, pl) {
                    var $plindex = $(this);
                    linkP.push({
                        title: $plindex.attr("title"),
                        url: $plindex.attr("href")
                    })
                });
                for (var c = 0; c < linkP.length; c++) {
                    var plObj = linkP[c];
                    var play_url = base_url + plObj.url;
                    var play_html = await utils.get(play_url);
                    var $4 = cheerio.load(play_html, {decodeEntities: false});
                    var scripts = $4(".hy-player").find("script").html().replace(/var VideoInfoList=/g, "").split("$$$");
                    for (var a = 0; a < scripts.length; a++) {
                        var playSAS = scripts[a].split("$$");
                        var playBSA = playSAS[1].split("$");
                        playList.push({
                            play: "在线播放",//播放器
                            title: playBSA[0],
                            url: playBSA[1]
                        });
                    }
                    break;
                }
                if (playList.length > 0) {
                    $2.children("script").remove();
                    $2.children(".bds_qzone").remove();
                    $2.children(".bds_tsina").remove();
                    $2.children(".bds_weixin").remove();
                    var description = $2('.tab-content').find(".hy-play-list").find(".plot").html();
                    description = StringUtils.htmlEncodeByRegExp(description);
                    var tag_id = moveObj.tag_id;
                    var move_id = "";
                    if (exits == false) {
                        moveObj = await moveService.insert(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                        move_id = moveObj.insertId;
                        var tagObj = await moveTagService.insert(conn, [move_id, tag_id]);
                        for (var u = 0; u < actors.length; u++) {
                            var actorObj = await actorService.findActorByName(actors[u]);
                            if (actorObj && actorObj.data.length > 0) {
                                var actor_id = actorObj.data[0]['id'];
                                await moveActorService.insert(conn, [move_id, actor_id]);
                            } else {
                                actorObj = await actorService.insert(conn, [actors[u], "", "", 1]);
                                var actor_id = actorObj.insertId;
                                await moveActorService.insert(conn, [move_id, actor_id]);
                            }
                        }
                    } else {
                        move_id = movelist.data[0]['id'];
                    }

                    for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        var moveUrlExists = await moveUrlService.findMoveByName(move_id, playObj.title, "在线播放");
                        if (moveUrlExists && moveUrlExists.data.length > 0) {
                            logger.info("===" + title + "__" + playObj.title + "鏈接已经存在里");
                        } else {
                            await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                        }
                    }
                    mysql.commit(conn);
                } else {
                    logger.info(title + "無鏈接");
                    mysql.rollback(conn);
                }
                logger.info("=====第" + page + "_" + i + "条======完成");
            } catch (e) {
                mysql.rollback(conn);
                logger.error(e);
            }
        }
        //await pageService.update();
        process.exit(0);
    })();
};

//schedule.scheduleJob('*/2 * * * *', function(){
    logger.info("====================="+new Date()+"======================");
    crawler();
//});
/*
setInterval(function () {
    logger.info("====================="+new Date()+"======================");
    crawler();
},120*1000);*/
