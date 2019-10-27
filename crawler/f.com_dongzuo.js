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
var pageService = require("../core/service/pageService");
var schedule = require("node-schedule");
var logger = require('../core/logger').getLogger("system");
var base_url = "http://www.52gqhd.com";
var url = "http://www.52gqhd.com/play/plist/15";
var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var ab = 1;//pageObj.data[0]['page'];
        //列表
        if (ab == 1) {
            url = url + ".html";
        } else {
            url = url + "_" + ab + ".html";
        }
        //var html = await utils.get(url);
        //var $ = cheerio.load(html, {decodeEntities: false});
        var $ = await utils.request(url,"utf-8");
        var data = $('.mov_list li div.pic a');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            console.log("第" + ab + "页=====第" + i + "条======");
            var a = dt.attribs.href;
            var src = dt.children[0].attribs.src;
            var hd = $('.mov_list li').eq(i).find("font").html();
            var title = dt.children[0].attribs.title;//+ (hd? "-"+hd: "");
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
                source: "52lailook",
                description: "",
                sets: "",
                creator_id: 1
            };
            var actors = [];
            var type = "";//类型：动作片，剧情片
            var year = "";//年代
            var area = "";//区域
            var sets = "";//集数
            var content = "";
            var playList = [];

            //var detail_html = await utils.get(detail_url);
            //var $2 = cheerio.load(detail_html, {decodeEntities: false});
            var $2 = await utils.request(detail_url,"utf-8");
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var $5 = $2("#nr_if");
                var p = $2("#nr_if").children("p");
                var h1 = $2("#nr_if").find("h1");
                var title2 = h1.text()
                p.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //电影
                        //var title2 = chapter.find("a").text();
                    } else if (index == 2) {
                        //演员表：
                        var actorList = chapter.find("a");
                        actorList.each(function (a, al) {
                            if ($(this).text() != "") {
                                actors.push($(this).text());
                            }
                        });
                    } else if (index == 3) {
                        //类型：
                        type = chapter.find("a").text();
                        var str = chapter.text();//类型：动作片 年代：2018  地区：中国 更新：2018-05-19
                        var list = str.split(" ");
                        for (var k = 0; k < list.length; k++) {
                            if (list[k] != "") {
                                var typeItem = list[k].split("：");
                                if (k == 0) {
                                    //集数：动作片
                                    sets = typeItem[1];
                                }
                                if (k == 1) {
                                    //类型：动作片
                                    type = typeItem[1];
                                }
                                if (k == 2) {
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
                moveObj.sets = sets;

                if (type != "" && type.indexOf("国产") >= 0) {
                    moveObj.tag_id = 7;
                } else if (type != "" && type.indexOf("欧美") >= 0) {
                    moveObj.tag_id = 6;
                } else if (type != "" && type.indexOf("港剧") >= 0) {
                    moveObj.tag_id = 8;
                } else if (type != "" && type.indexOf("韩剧") >= 0) {
                    moveObj.tag_id = 9;
                } else if (type != "" && type.indexOf("日剧") >= 0) {
                    moveObj.tag_id = 10;
                } else if (type != "" && type.indexOf("台湾") >= 0) {
                    moveObj.tag_id = 11;
                } else if (type != "" && type.indexOf("泰剧") >= 0) {
                    moveObj.tag_id = 12;
                }

                //网盘链接：
                var div = $2("#nr_if #div");
                //播放地址
                var playurlm = $2("#nr_if .playurl");
                if (playurlm) {
                    var titleP = [];
                    var linkP = [];
                    var playP = playurlm.find("p");
                    playP.each(function () {
                        var pItem = $(this);
                        titleP.push(pItem.text());
                    });
                    var playul = playurlm.find("ul");
                    playul.each(function (indexa) {
                        var ulitem = $(this);
                        var playLi = ulitem.find("li");
                        var uSets = [];
                        playLi.each(function () {
                            var liItem = $(this);
                            var liItemA = liItem.find("a");
                            uSets.push({
                                title: liItemA.text(),
                                link: liItemA.attr('href')
                            });
                        });
                        linkP.push(uSets);
                    });
                    for (var j = 0; j < titleP.length; j++) {
                        var source = "";
                        var titlePlay = titleP[j];
                        var linkPlay = linkP[j];
                        //for (var uu = 0; uu < linkPlay.length; uu++) {
                        var play_url = base_url + linkPlay[0].link;
                        //play_url = "http://www.52gqhd.com/play/player/16750-1-19.html";
                        //var play_html = await utils.get(play_url);
                        //var $3 = cheerio.load(play_html, {decodeEntities: false});

                        var $3 = await utils.request(play_url,"utf-8");
                        var script = $3("center div script");
                        script.each(function (o, abcd) {
                            var sc = $(this);
                            if (sc.html() != "") {
                                var playList222 = sc.html().replace(/\n|\"/g, "");
                                if(titlePlay.trim() == "优酷" || titlePlay.trim()=="youku"){
                                    source = playList222.substr(playList222.indexOf("=")+1);
                                } else {
                                    source = playList222.split("=")[1];
                                }
                                if (source != "" && (source.indexOf("(function()") == -1 && source.indexOf("{") == -1)) {
                                    if (source.indexOf("+++") > -1) {
                                        var list = source.split("+++");
                                        for (var pi = 0; pi < list.length; pi++) {
                                            var pli = list[pi].split("$");
                                            var ptitle = pi + 1;
                                            if((ptitle + "").indexOf("集")==-1){
                                                ptitle = ptitle + "集";
                                            }
                                            var purl = pli[0];
                                            if (pli.length > 1) {
                                                ptitle = pli[0];
                                                purl = pli[1];
                                            }
                                            logger.info("====获取到第" + ab + "页"+titlePlay+"第"+ptitle+"=====")
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
                                            title: linkPlay[0].title,
                                            url: playUrl
                                        });
                                    }
                                }
                            }
                        });
                        //break;
                        //}
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
                if (playList.length > 0) {
                    var description = StringUtils.htmlEncodeByRegExp(content);
                    var move_id = "";
                    if (exits == false) {
                        moveObj = await moveService.insert2(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.sets, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                        move_id = moveObj.insertId;
                        var tagObj = await moveTagService.insert(conn, [move_id, 1]);

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

                        for (var f = 0; f < downloadList.length; f++) {
                            var downloadObj = downloadList[f];
                            await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url,2, 1]);
                        }
                    } else {
                        move_id = movelist.data[0]['id'];
                        logger.info("===更新=====");
                        await moveService.update(conn, sets,move_id);
                    }
                    /*for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                    }*/

                    for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        logger.info("====第" + ab + "页保存"+playObj.play+playObj.title+"=====")
                        if ((playObj.play + "").trim() != "快播") {
                            var moveUrlExists = await moveUrlService.findMoveByName(move_id, playObj.title, playObj.play);
                            if (moveUrlExists && moveUrlExists.data.length > 0) {
                                logger.info("===" + title + "__" + playObj.title + "鏈接已经存在里");
                            } else {
                                await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                            }
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
                console.log(e);
            }
        }
        //await pageService.update();
        process.exit(0);
    })();
};
//schedule.scheduleJob('*/3 * * * *', function(){
//while (true) {
    logger.info("=====================" + new Date() + "======================");
    crawler();
//}
//});
