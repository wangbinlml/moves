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
var base_url = "http://m.kanww.com";
var url = "http://m.kanww.com/list/";

//yy6029 电视剧哈
var crawler = function () {
    (async () => {
        var pageObj = await pageService.findAll(9);
        var ab = pageObj.data[0]['page'];
        if (ab < 2) {
            ab = 2;
        }
        //列表
        if(ab == 2) {
            url = url + ab+".html";
        } else {
            url = url + "2_" + ab + ".html";
        }
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('#data_list li .con');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            console.log("第" + ab + "页=====第" + i + "条======");
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var src = dt.children[1].children[1].attribs['data-src'];
                var title = dt.children[1].children[5].children[0].data;
                var a = dt.children[1].attribs.href;
                var playParam = a.split("?")[1];
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
                    source: "m.kanww.com",
                    description: "",
                    sets: "全集",
                    creator_id: 1
                };
                var actors = [];
                var type = "";//类型：国产剧
                var year = "0";//年代
                var area = "未知";//区域
                var sets = "全集";//集数
                var content = "暂无内容";


                var html2 = await utils.get(detail_url);
                var $2 = cheerio.load(html2, {decodeEntities: false});

                sets = $2(".introTxt .sDes").text();
                //description
                var p = $2(".tabCon .ulTxt li");
                p.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //点击
                    } else if (index == 1) {
                        //年份：
                        year = chapter.find("em").text();
                    } else if (index == 2) {
                        //地区：
                        area = chapter.find("em").text();
                    } else if (index == 3) {
                        //类型： 【年　代】：2018  【地　区】：欧美
                        type = chapter.find("em").text();
                    }
                });

                if (type != "" && type.indexOf("国产") >= 0) {
                    moveObj.tag_id = 7;
                } else if (type != "" && type.indexOf("欧美") >= 0) {
                    moveObj.tag_id = 6;
                } else if (type != "" && type.indexOf("香港") >= 0) {
                    moveObj.tag_id = 8;
                } else if (type != "" && type.indexOf("韩国") >= 0) {
                    moveObj.tag_id = 9;
                } else if (type != "" && type.indexOf("日本") >= 0) {
                    moveObj.tag_id = 10;
                } else if (type != "" && type.indexOf("台湾") >= 0) {
                    moveObj.tag_id = 11;
                } else if (type != "" && type.indexOf("泰国") >= 0) {
                    moveObj.tag_id = 12;
                }

                if(area == "大陆"){
                    area = "中国大陆"
                } else if(area == "台湾"){
                    area = "中国台湾"
                } else if(area == "香港"){
                    area = "中国香港"
                }
                var hidden_intro = $2(".tabCon").find("input").val();
                content = hidden_intro.replace(/<\/?.+?>/g,"").replace(/收起/g,"");

                var playList = [];
                //在线播放1
                var playName = $2(".tabCon .play-title a").text();
                //播放资源
                var playA = $2(".tabCon .ulNumList li");
                playA.each(function (index, item) {
                    var chapter = $(this);
                    var href = chapter.find("a").attr("href");
                    var title2 = chapter.find("a").attr("title");
                    playList.push({
                        href: href,
                        title: title2
                    })
                });
                var ppp = playName ;
                var obj =  playList[0];
                var playUrl = base_url + obj.href;
                var title3 = obj.title;
                var html222 = await utils.get(playUrl);
                var $7 = cheerio.load(html222, {decodeEntities: false});
                var script = $7("script")[6]['children'][0]['data'];
                var scripts = script.replace("var VideoInfoList=\"","").replace("\"","").replace("ck$$","#").split("$jx");
                var playListSource = [];
                var playSourceListUrlsList = [];
                for (var oo = 0; oo < scripts.length; oo++) {
                    var ef = scripts[oo];
                    if(ef == "") continue;
                    var tt = "#"+playList[oo]['title']+"$";
                    var id = ef.replace(tt,"");
                    var iframe = "https://ck.ee7e.com/jx.php?id="+id;
                    var html333 = await utils.get3("https://ck.ee7e.com/jx.php?id="+id);
                    var $8 = cheerio.load(html333, {decodeEntities: false});
                    var sct = $8("script")[8]['children'][0]['data'];
                    var urls = utils.httpString(sct);
                    var url3 = urls[1];
                    /*if(oo == 0){
                        playSourceListUrlsList.push({
                            play: "iframe",//播放器
                            title: playList[oo]['title'],
                            url: iframe
                        });
                    }*/
                    playSourceListUrlsList.push({
                        play: ppp,//播放器
                        title: playList[oo]['title'],
                        url: url3
                    });
                    logger.info(moveObj.name+":"+playList[oo]['title']+":"+url3)
                }
                playListSource.push({
                    play: ppp,
                    list: playSourceListUrlsList
                });

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
                                logger.info("====第" + ab + "页保存" + playObj.play + playObj.title + playObj.url + "=====线路" + [abc])
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
        //await pageService.update(9);
        process.exit(0);
    })();
};
//schedule.scheduleJob('*/1 * * * *', function(){
//while (true) {
logger.info("=====================" + new Date() + "======================");
crawler();
//}
//});
