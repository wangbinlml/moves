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
var base_url = "https://www.lookpian.com";
var schedule = require("node-schedule");

var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var page = 1;//pageObj.data[0]['page'];
        var url = "https://www.lookpian.com/search.php?page="+page+"&searchtype=5&tid=1";
        logger.info("url: " + url);
        var html = await utils.get2(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('.hy-video-list ul li');
        for (var i = 0; i < data.length; i++) {
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var dt = data[i];
                var href = dt.children[0].attribs.href;
                var src = dt.children[0].attribs['data-original'];
                var title = dt.children[0].attribs.title;
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
                    source: "lookpian",
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
                var detail_html = await utils.get2(detail_url);
                var $2 = cheerio.load(detail_html, {decodeEntities: false});
                var detail_li = $2('.hy-video-details .content').find("ul").find("li");
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
                var playa = $2('.tab-content').find("#playlist").find("a").eq(0).attr("title");
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
                    var play_html = await utils.get2(play_url);
                    var $4 = cheerio.load(play_html, {decodeEntities: false});
                    var scripts = unescape($4(".hy-player").find("script").html()).replace(/var VideoInfoList=unescape\(\"/g, "").replace(/\"\)/g,"").replace(/\$\$[\s\S]*?(\$)/g,"$$$");
                    scripts = scripts.split("$$");
                    var playBSA = scripts[1].split("$");
                    var urlPy = playBSA[0];
                    var play = "";
                    if(urlPy.indexOf("m3u8")>0) {
                        play = "在线播放";
                    } else */
                    if(urlPy.indexOf("qq.com") >=0 || playa.indexOf("qq")>=0 || playa.indexOf("腾讯")>=0) {
                        play = "腾讯视频";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex);
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    } else if(urlPy.indexOf("iqiyi.com") >=0 || playa.indexOf("qiyi")>=0 || playa.indexOf("爱奇艺")>=0) {
                        play = "爱奇艺";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex);
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    }  else if(urlPy.indexOf("mgtv.com") >=0 || playa.indexOf("mgtv")>=0 || playa.indexOf("mgtv")>=0) {
                        play = "mgtv";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex);
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    } else if(urlPy.indexOf("bdstatic.com") >=0) {
                        play = "iframe";
                        urlPy = "https://apis.tianxianle.com/mp4/mp4.php?id="+urlPy;
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    } else  if(urlPy.indexOf("le.com") >=0 || playa.indexOf("乐视") >=0) {
                        play = "letv";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex);
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    }  else  if(urlPy.indexOf("sohu.com") >=0 || playa.indexOf("搜狐") >=0) {
                        play = "sohu";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex);
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    } else if (urlPy.indexOf("youku.com")>=0) {
                        play = "youku";
                        var dotIndex = urlPy.lastIndexOf(".");
                        var pIndex = urlPy.lastIndexOf("/");
                        urlPy = urlPy.substring(pIndex+1,dotIndex).replace("id_","");
                        playList.push({
                            play: play,//播放器
                            title: plObj.title,
                            url: urlPy
                        });
                    }
                    logger.info("=====play=" + play + "===="+moveObj.name + "====urlPy==="+urlPy);
                    break;
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
                        var moveUrlExists = await moveUrlService.findMoveByName(move_id, playObj.title, playObj.play);
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

//schedule.scheduleJob('*/1 * * * *', function(){
logger.info("====================="+new Date()+"======================");
crawler();
//});
/*
setInterval(function () {
    logger.info("====================="+new Date()+"======================");
    crawler();
},120*1000);*/
