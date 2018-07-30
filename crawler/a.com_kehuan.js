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
var base_url = "http://www.52lailook.com";
//动作
var url = "http://www.52lailook.com/play/plist/11";
(async () => {
    //for (var ab = 1; ab <10; ab++) {
    for (var ab = 1; ab > 0; ab--) {
        //列表
        if(ab ==1){
            url = url + ".html";
        } else {
            url = url + "_" + ab + ".html";
        }
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        //var data = $('.mov_list li div.pic a');
        var data = $('.mov_list li div.pic a');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            console.log("第"+ab+"页=====第" + i + "条======");
            var a = dt.attribs.href;
            var src = dt.children[0].attribs.src;
            var hd = $('.mov_list li').eq(i).find("font").html();
            var title = dt.children[0].attribs.title+ (hd? "-"+hd: "");
            var detail_url = base_url + a;
            var movelist = await moveService.findMoveByName(title);
            var exits = false;
            if (movelist && movelist.data.length > 0) {
                logger.info("===" + title + "已经存在里");
                exits = true;
            }
            var moveObj = {
                category_id: 1,
                tag_id: 2,
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

            var detail_html = await utils.get(detail_url);
            var $2 = cheerio.load(detail_html, {decodeEntities: false});

            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var $5 = $2("#nr_if");
                var p = $2("#nr_if").children("p");
                p.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //电影
                        var title2 = chapter.find("a").text();
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
                        var str = chapter.text();//类型：动作片 年代：2018  地区：中国 更新：2018-05-19
                        var list = str.split(" ");
                        for (var k = 0; k < list.length; k++) {
                            if (list[k] != "") {
                                var typeItem = list[k].split("：");
                                if (k == 0) {
                                    //类型：动作片
                                }
                                if (k == 1) {
                                    //年代：2018
                                    year = typeItem[1];
                                }
                                if (k == 3) {
                                    //地区：中国
                                    area = typeItem[1];
                                }
                            }
                        }
                    } else {
                        content = content + chapter.html();
                    }
                    $5.children("p").eq(index).remove();
                });
                moveObj.year = year;
                moveObj.area = area;

                //网盘链接：
                var div = $2("#nr_if #div");
                //播放地址
                var playurlm = $2("#nr_if .playurlm");
                if (playurlm) {
                    var titleP = [];
                    var linkP = [];
                    var playP = playurlm.find("p");
                    playP.each(function () {
                        var pItem = $(this);
                        titleP.push(pItem.text());
                    });
                    var playLi = playurlm.find("li");
                    playLi.each(function () {
                        var liItem = $(this);
                        var liItemA = liItem.find("a");
                        linkP.push({
                            title: liItemA.text(),
                            link: liItemA.attr('href')
                        });
                    });
                    for (var j = 0; j < titleP.length; j++) {
                        var source = "";
                        var titlePlay = titleP[j];
                        var linkPlay = linkP[j];
                        var play_url = base_url + linkPlay.link;
                        var play_html = await utils.get(play_url);
                        var $3 = cheerio.load(play_html, {decodeEntities: false});
                        var script = $3("center div script");
                        script.each(function (o, abcd) {
                            var sc = $(this);
                            if (sc.html() != "") {
                                source = sc.html().replace(/\n|\"/g, "").split("=")[1];
                                if (source != "" && (source.indexOf("(function()") == -1 && source.indexOf("{") == -1)) {
                                    if (source.indexOf("+++") > -1) {
                                        var list = source.split("+++");
                                        for (var pi = 0; pi<list.length;pi++) {
                                            var pli = list[pi].split("$");
                                            var ptitle = pli[0];
                                            var purl = pli[1];
                                            playList.push({
                                                play: titlePlay,//播放器
                                                title: ptitle,
                                                url: purl
                                            });
                                        }
                                    } else {
                                        var playUrl = source.substr(source.indexOf("$") + 1);
                                        playList.push({
                                            play: titlePlay,//播放器
                                            title: linkPlay.title,
                                            url: playUrl
                                        });
                                    }
                                }
                            }
                        });
                    }
                }

                //下载地址
                var downloadList = [];
                var ui_box = $2("#nr_if .ui-box .down_list ul li .down_part_name a");
                if (ui_box) {
                    ui_box.each(function () {
                        var a = $(this);
                        var href = a.attr("href");
                        var txt = a.text();
                        downloadList.push({
                            title: txt,
                            url: href
                        });
                    });
                }
                $5.children("p").eq(0).remove();
                $5.children("hr").remove();
                $5.children("script").remove();
                $5.children(".bds_qzone").remove();
                $5.children(".bds_tsina").remove();
                $5.children(".bds_weixin").remove();
                $5.find(".ui-box").remove();
                $5.find(".jiathis_style_24x24").parent().remove();
                $5.find("#div").remove();
                $5.find(".playurlm").remove();
                if (playList.length > 0) {
                    var htm = $5.html();//.replace(/\n/g,"");
                    //http://i5.tietuku.com/26c48f01d8ff811ds.png
                    if (htm.indexOf("</a>") > 0) {
                        htm = htm.substr(htm.indexOf("</a>") + 4);
                    }
                    var description = StringUtils.htmlEncodeByRegExp(htm);
                    moveObj = await moveService.insert(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                    var move_id = moveObj.insertId;
                    var tagObj = await moveTagService.insert(conn, [move_id, 2]);

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
                    /*for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                    }*/
                    for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        var moveUrlExists = await moveUrlService.findMoveByName(move_id, playObj.title, playObj.play);
                        if (moveUrlExists && moveUrlExists.data.length > 0) {
                            logger.info("===" + title + "__" + playObj.title + "鏈接已经存在里");
                        } else {
                            await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                        }
                    }
                    for (var f = 0; f < downloadList.length; f++) {
                        var downloadObj = downloadList[f];
                        await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url, 1]);
                    }

                    mysql.commit(conn);
                } else {
                    logger.info(title + "無鏈接");
                    mysql.rollback(conn);
                }
                console.log("第"+ab+"页=====第" + i + "条======完成");
            } catch (e) {
                mysql.rollback(conn);
                console.log(e);
            }
        }
    }
    process.exit(0);
})();