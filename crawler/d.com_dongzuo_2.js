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
var base_url = "http://www.yingshidaquan.cc";
var schedule = require("node-schedule");

var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var page = 2;//pageObj.data[0]['page'];
        var url = "http://www.yingshidaquan.cc/vod-show-id-1-year--area--order--p-" + page + ".html";
        logger.info("url: " + url);
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('.movielist ul li a.p');
        for (var i = 0; i < data.length; i++) {
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var dt = data[i];
                var href = dt.attribs.href;
                var src = dt.children[0].attribs.src;
                var title = dt.children[0].attribs.alt;
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
                var detail_li = $2('#main .view .info').find("ul").find("li");
                detail_li.each(function (index, item) {
                    var $li2 = $(this);
                    if (index == 0) {
                        //年代
                        year = ($li2.text() + "").replace(/上映年代：|状态：全集/g, "").trim();
                    } else if (index == 1) {
                        //豆瓣
                    } else if (index == 2) {
                        //类型
                        type = ($li2.text() + "").replace(/类型：/g, "");

                    } else if (index == 3) {
                        //地区
                        area = ($li2.text() + "").replace(/地区：/g, "");
                    } else if (index == 4) {
                        actors = ($li2.text() + "").replace(/主演：/g, "").split(",");
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
                } else {
                    moveObj.tag_id = 4;
                }
                if(area == "大陆"){
                    area = "中国大陆"
                } else if(area == "台湾"){
                    area = "中国台湾"
                } else if(area == "香港"){
                    area = "中国香港"
                }
                moveObj.area = area;
                moveObj.year = year || 2017;
                $2('.playendpage').find(".mox").eq(0).remove();
                var playlist = $2('.playendpage').find(".mox");

                var linkP = [];
                var abcd = href.replace(/html/g,"play").split(".");
                playlist.each(function (index2, pl) {
                    var $plindex = $(this);
                    var player = $plindex.find("span").eq(1).text();
                    var ahref = $plindex.find(".play-list").children("a");
                    var bhref = ahref.attr("href");
                    var name = ahref.attr("title");
                    var chref = abcd[0] +"-"+ index2 + "-1.html";
                    linkP.push({
                        title: name,
                        player: player,
                        url: chref
                    })
                });

                for (var c = 0; c < linkP.length; c++) {
                    var plObj = linkP[c];
                    var play_url = base_url + plObj.url;
                    var play_html = await utils.get(play_url);
                    var $4 = cheerio.load(play_html, {decodeEntities: false});
                    var playListB = $4("#endplay").find("iframe");
                    for (var a = 0; a < playListB.length; a++) {
                        var playSAS = scripts[a].split("$$");
                        var playBSA = playSAS[1].split("$");
                        playList.push({
                            play: "在线播放",//播放器
                            title: playBSA[0],
                            url: playBSA[1]
                        });
                    }
                }
                if (playList.length > 0) {
                    $2('.tab-content').find(".hy-play-list").find(".plot").find("script").remove();
                    $2('.tab-content').find(".hy-play-list").find(".plot").find(".bds_qzone").remove();
                    $2('.tab-content').find(".hy-play-list").find(".plot").find(".bds_tsina").remove();
                    $2('.tab-content').find(".hy-play-list").find(".plot").find(".bds_weixin").remove();
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
