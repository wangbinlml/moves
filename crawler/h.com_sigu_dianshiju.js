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
var base_url = "http://v.sigu.me";
var url = "http://v.sigu.me/list.php?";
var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll(6);
        var ab = 1;//pageObj.data[0]['page'];
        if (ab < 0) {
            ab = 1;
        }
        //列表
        url = url + "page=" + ab + "&type=2";
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('.v_con_box li');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            console.log("第" + ab + "页=====第" + i + "条======");
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var src = dt.children[1].children[0].attribs['data-src'];
                var title = dt.children[1].children[0].attribs.alt;
                var a = dt.children[1].children[4].attribs.href;
                var playParam = a.split("?")[1];
                var detail_url = base_url + "/play.php?" + escape(playParam);

                //演员
                var actAbc = dt.children[3].children[3].children[0].data.replace("演员：", "");
                var movelist = await moveService.findMoveByName(title);

                var exits = false;
                if (movelist && movelist.data.length > 0) {
                    logger.info("===" + title + "已经存在里");
                    exits = true;
                }
                var moveObj = {
                    category_id: 2,
                    tag_id: 7,
                    name: title,
                    cover: src,
                    source: "sigu.me",
                    description: "",
                    sets: "全集",
                    creator_id: 1
                };
                var actors = [];
                var type = "7";//类型：国产剧
                var year = "0";//年代
                var area = "未知";//区域
                var sets = "全集";//集数
                var content = "暂无内容";
                var playList = [];

                var actorList = actAbc.split(" ");
                for (var oo = 0; oo < actorList.length; oo++) {
                    if (actorList[oo] != "") {
                        actors.push(actorList[oo]);
                    }
                }
                var html2 = await utils.get(detail_url);
                var $2 = cheerio.load(html2, {decodeEntities: false});
                var flag = false;
                var pages = [];
                for (var pp = 0; pp < 80; pp++) {
                    try {
                        var aaaa = "http://v.sigu.me/souce/arr.php?bing=" + pp + "&" + playParam;
                        var bbbb = await utils.get(aaaa);
                        if (bbbb == "[null]") {
                            break;
                        }
                        console.log("===="+pp+"=====")
                        pages.push("1");
                    } catch (e) {
                        flag = true;
                    }
                    if (flag) {
                        break;
                    }
                }
                var playListSource = [];
                for (var uu = 0; uu < pages.length; uu++) {
                    var ppp = "在线资源" + (uu + 1);
                    var playSource = "http://v.sigu.me/souce/arr.php?bing=" + uu + "&" + playParam;
                    var sourceList = await utils.get(playSource);
                    sourceList = JSON.parse(sourceList);
                    var playSourceListUrlsList = [];
                    var apiUrl = "http://api.bbbbbb.me";
                    for (var y = 0; y < sourceList.length; y++) {
                        var html222 = await utils.get(apiUrl + "/jx/?url=" + escape(sourceList[y]));
                        var $7 = cheerio.load(html222, {decodeEntities: false});
                        var sourceLines = $7(".panel").find("a");
                        for (var b = 0; b < sourceLines.length; b++) {
                            var sourceLine = sourceLines[b];
                            var sourceHref = unescape(sourceLine.attribs.href);
                            var sourceTitle = sourceLine.children[0].data;
                            var reg = /sigu\('(\S+)'\)/g;
                            var result = reg.exec(sourceHref);
                            var params = result[1].substring(result[1].indexOf("?url=") + 5);
                            var uri = result[1].substring(0, result[1].indexOf("?") + 1);
                            result = escape(params);
                            var sHref = apiUrl + uri + "url=" + result;
                            playSourceListUrlsList.push({
                                play: ppp,//播放器
                                title: sourceTitle,
                                url: sHref
                            });
                        }
                    }
                    playListSource.push({
                        play: ppp,
                        list: playSourceListUrlsList
                    });
                }

                moveObj.year = year;
                moveObj.area = area;
                moveObj.sets = sets;

                //下载地址
                var downloadList = [];

                if (playListSource.length > 0) {
                    var description = StringUtils.htmlEncodeByRegExp(content);
                    var move_id = "";
                    if (exits == false) {
                        moveObj = await moveService.insert2(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.sets, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                        move_id = moveObj.insertId;
                        var tagObj = await moveTagService.insert(conn, [move_id, 7]);

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
                        await moveService.update(conn, sets, move_id);
                    }

                    for (var f = 0; f < downloadList.length; f++) {
                        var downloadObj = downloadList[f];
                        var actorObj = await moveDownloadService.findDownloadInfo(move_id, downloadObj.title);
                        if (actorObj && actorObj.data.length == 0) {
                            await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url, 1]);
                        }
                    }
                    /*for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                    }*/

                    for (var abc = 0; abc < playListSource.length; abc++) {
                        var playSourceListUrlsLista = playListSource[abc]['list'];
                        for (var r = 0; r < playSourceListUrlsLista.length; r++) {
                            var playObj = playSourceListUrlsLista[r];
                            logger.info("====第" + ab + "页保存" + playObj.play + playObj.title + "=====线路"+[abc])
                            if ((playObj.play + "").trim() != "快播") {
                                var moveUrlExists = await moveUrlService.findMoveByName(move_id, playObj.title, playObj.play);
                                if (moveUrlExists && moveUrlExists.data.length > 0) {
                                    logger.info("===" + title + "__" + playObj.title + "鏈接已经存在里");
                                } else {
                                    await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                                }
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
        await pageService.increment(6);
        process.exit(0);
    })();
};
//schedule.scheduleJob('*/1 * * * *', function(){
//while (true) {
logger.info("=====================" + new Date() + "======================");
crawler();
//}
//});
