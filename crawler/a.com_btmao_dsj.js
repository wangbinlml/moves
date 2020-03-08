//依赖模块
var fs = require('fs');
var cheerio = require('cheerio');
var moment = require('moment');
var utils = require("../core/util/utils");
var StringUtils = require("../core/util/StringUtils");
var mysql = require("../core/mysql");
var actorService = require("../core/service/actorService");
var categoryService = require("../core/service/categoryService");
var moveActorService = require("../core/service/moveActorService");
var moveDownloadService = require("../core/service/moveDownloadService");
var moveService = require("../core/service/moveService");
var moveTagService = require("../core/service/moveTagService");
var moveUrlService = require("../core/service/moveUrlService");
var tagService = require("../core/service/tagService");


var logger = require('../core/logger').getLogger("system");
// bt猫
var base_url = "https://www.btmao.cc/";
//动作
var url = "https://www.btmao.cc/list/s-2-wd--letter--year-0-area--order--p";
(async () => {
    //for (var ab = 1; ab <535; ab++) {
    for (var ab = 271; ab > 0; ab--) {
        //列表
        url = url + "-" + ab + ".html";

        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var sets = $('#videoData li div.minfo div').eq(4).text();
        var data = $('#videoData li div.imgBox a');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            logger.info("第" + ab + "页=====第" + i + "条======");
            var a = dt.attribs.href;
            var src = dt.children[1].attribs['data-original'];
            //var hd = $('.mov_list li').eq(i).find("font").html();
            var title = dt.attribs.title;//+ (hd? "-"+hd: "");
            var detail_url = base_url + a;
            var movelist = await moveService.findMoveByName(title);

            var exits = false;
            if (movelist && movelist.data.length > 0) {
                logger.info("===" + title + "已经存在里");
                exits = true;
            }
            var moveObj = {
                category_id: 2,
                tag_id: 13,
                name: title,
                cover: src,
                sets: "",
                source: "www.btmao.cc",
                description: "",
                creator_id: 1
            };
            var actors = [];
            var type = "";//类型：动作片，剧情片
            var year = "";//年代
            var area = "";//区域
            var content = "";
            var playList = [];

            var detail_html = await utils.get(detail_url);
            var $2 = cheerio.load(detail_html, {decodeEntities: false});

            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                moveObj.description = $2("div.vodinfobox li.cont .jjText span.more").attr('txt');
                var li = $2("div.vodinfobox ul li");
                li.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //导演
                        //var title2 = chapter.find("a").text();
                    } else if (index == 1) {
                        //演员表：
                        var actorList = chapter.find("a");
                        actorList.each(function (a, al) {
                            if ($(this).text() != "") {
                                actors.push($(this).text());
                            }
                        });
                    } else if (index == 2) {
                        //类型：
                        type = chapter.find("a").text();
                    } else if (index == 3) {
                        // 地区
                        area = chapter.find("span").text();
                    } else if (index == 5) {
                        // 地区
                        year = chapter.find("span").text();
                    }
                });
                moveObj.year = year;
                moveObj.area = area;
                moveObj.sets = sets;
                if (type != "" && type.indexOf("国产") >= 0) {
                    moveObj.tag_id = 7;
                } else if (type != "" && type.indexOf("欧美") >= 0) {
                    moveObj.tag_id = 6;
                } else if (type != "" && area.indexOf("港") >= 0) {
                    moveObj.tag_id = 8;
                } else if (type != "" && area.indexOf("韩") >= 0) {
                    moveObj.tag_id = 9;
                } else if (type != "" && area.indexOf("日") >= 0) {
                    moveObj.tag_id = 10;
                } else if (type != "" && area.indexOf("台") >= 0) {
                    moveObj.tag_id = 11;
                } else if (type != "" && area.indexOf("泰") >= 0) {
                    moveObj.tag_id = 12;
                }


                var juji = $2("#vodbox #playTabcon .vodplaybox div.juji ul li");
                if (juji) {
                    var linkP = [];
                    juji.each(function () {
                        var pItem = $(this);
                        var liItemA = pItem.find("a");
                        linkP.push({
                            title: liItemA.text(),
                            link: liItemA.attr('href')
                        });
                    });
                    if (linkP.length > 0) {
                        var linkPlay = linkP[0];
                        var play_url = base_url + linkPlay.link;
                        //play_url = "http://www.52gqhd.com/play/player/16750-1-19.html";
                        var play_html = await utils.get(play_url);
                        var $3 = cheerio.load(play_html, {decodeEntities: false});
                        var script = $3("div#players script").eq(0)[0].children[0].data;
                        var playObj = JSON.parse(eval("(" + script.replace("var ff_urls=", "").replace(";", '') + ")"));

                        var playBack = playObj.Data;
                        var PlayArr = [];
                        if(playBack.length>0){
                            for (let j = 0; j <playBack.length ; j++) {
                                var itemList = playBack[j]
                                if(itemList) {
                                    PlayArr = itemList['playurls'];
                                    break;
                                }
                            }
                        }

                        for (let j = 0; j < PlayArr.length; j++) {
                            const item = PlayArr[j];
                            playList.push({
                                play: '在线播放',//播放器
                                title: item[0],
                                url: item[1]
                            });
                        }
                    }
                }
                var xunlei = $2("#vodbox #playTabcon .vodplaybox div.down_list ul li");
                //下载地址
                var downloadList = [];
                if (xunlei) {
                    xunlei.each(function () {
                        var a = $(this);
                        var liItemA = a.find("input");

                        var href = liItemA.attr("value");
                        var txt = liItemA.attr("file_name");
                        downloadList.push({
                            title: txt,
                            url: href
                        });
                    });
                }
                if (downloadList.length > 0 || playList.length > 0) {
                    var move_id = "";
                    if (exits == false) {
                        var tag_id =moveObj.tag_id;
                        var moveObj2 = await moveService.insert2(conn, [moveObj.category_id, tag_id, moveObj.name, year, area, moveObj.sets, moveObj.cover, moveObj.source, moveObj.description, moveObj.creator_id]);
                        move_id = moveObj2.insertId;
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
                        logger.info("===更新=====");
                        await moveService.update(conn, sets, move_id, moveObj.name);
                    }
                    for (var f = 0; f < downloadList.length; f++) {
                        var downloadObj = downloadList[f];
                        var downObj = await moveDownloadService.findDownloadInfo(move_id, downloadObj.title);
                        if (downObj && downObj.data.length == 0) {
                            await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url,0, 1]);
                        }
                    }
                    for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        logger.info("====第" + ab + "页保存" + playObj.play + playObj.title + "=====")
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
                logger.info("第" + ab + "页=====第" + i + "条======完成");
            } catch (e) {
                mysql.rollback(conn);
                logger.info(e);
            }
        }
    }
    process.exit(0);
})();