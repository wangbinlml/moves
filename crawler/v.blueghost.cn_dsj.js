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
var base_url = "https://v.blueghost.cn";
var url = "https://v.blueghost.cn/index.php/vod/type/id/2/page/";
var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var ab = 1;//pageObj.data[0]['page'];
        //列表
        url = url + ab + ".html";
        //var html = await utils.get(url);
        //var $ = cheerio.load(html, {decodeEntities: false});
        var $ = await utils.request(url,"utf-8");
        var data = $('.stui-vodlist li');
        for (var i = 0; i < data.length; i++) {
            try {
                var dt = data[i];
                console.log("第" + ab + "页=====第" + i + "条======");
                var a = dt.children[1].attribs.href;
                var src = dt.children[1].attribs['data-original'];
                var title = dt.children[1].attribs.title;//+ (hd? "-"+hd: "");
                var detail_url = base_url + a;
                var movelist = await moveService.findMoveByName(title);

                src = src.replace("https://cdnproxy.blueghost.cn/","http://");
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
                    source: "v.blueghost.cn",
                    description: "",
                    sets: "",
                    creator_id: 1
                };
                var actors = [];
                var year = "0";//年代
                var area = "未知";//区域
                var sets = "";//集数
                var content = "";
                var playList = [];


                //var detail_html = await utils.get(detail_url);
                //var $2 = cheerio.load(detail_html, {decodeEntities: false});
                var $2 = await utils.request(detail_url, "utf-8");
                var conn = await mysql.getConnection();
                mysql.beginTransaction(conn);
                try {
                    var plist = $2(".stui-content__detail p");
                    var type = "";
                    plist.each(function (index) {
                        if(index ==0) {
                            var p = $(this);
                            var spans = p.find("span.text-muted");
                            spans.each(function (ibc) {
                                var span = $(this);
                                var span_text = span.text().replace("：", "");
                                var avalue = p.find("a").eq(ibc).text();
                                if(ibc == 0) {
                                    //类型
                                    type = avalue;
                                } else if(ibc == 1) {
                                    //地区
                                    area = avalue;
                                } else if(ibc == 2) {
                                    //年份
                                    year = avalue;
                                }
                            });
                        } else if(index ==1) {
                            //集数
                            var p = $(this);
                            sets = p.text().replace("状态：","");
                        } else if(index ==2) {
                            //主演
                            var p = $(this);
                            var act_pat = p.text().split("：");
                            var actList = act_pat[1];
                            var actorList = actList.split(",");
                            for (var b = 0; b < actorList.length; b++) {
                                if (actorList[b] != "") {
                                    actors.push(actorList[b]);
                                }
                            }
                        }
                    });


                    if (type != "" && type.indexOf("国产") >= 0) {
                        moveObj.tag_id = 7;
                    } else if (type != "" && type.indexOf("欧美") >= 0) {
                        moveObj.tag_id = 6;
                    } else if (type != "" && type.indexOf("港") >= 0) {
                        moveObj.tag_id = 8;
                    } else if (type != "" && type.indexOf("韩") >= 0) {
                        moveObj.tag_id = 9;
                    } else if (type != "" && type.indexOf("日") >= 0) {
                        moveObj.tag_id = 10;
                    } else if (type != "" && type.indexOf("台") >= 0) {
                        moveObj.tag_id = 11;
                    } else if (type != "" && type.indexOf("泰") >= 0) {
                        moveObj.tag_id = 12;
                    }

                    content = $2(".stui-pannel").find(".stui-content__desc").text();
                    moveObj.year = year;
                    moveObj.cover = src;
                    moveObj.area = area;
                    moveObj.sets = sets;

                    var playUrl = base_url + $2(".playbtn a").attr("href");
                    var $3 = await utils.request(playUrl, "utf-8");

                    var tabsList = [];
                    var tabs = $3(".tabs section");
                    tabs.each(function (abc) {
                        var tab = $(this);
                        var obj = {};
                        var tab_title = tab.find("h2").text();
                        var lis = tab.find(".stui-content__playlist li");
                        var lists = [];
                        lis.each(function (abc) {
                            var li = $(this);
                            var a = li.find("a").attr("href");
                            var playUrl = base_url + a;
                            lists.push({
                                title: li.find("a").text(),
                                url: playUrl
                            });
                        });
                        obj.title = tab_title;
                        obj.list = lists;
                        tabsList.push(obj);
                    });
                    var playlist = [];
                    for (var index in tabsList) {
                        var tab = tabsList[index];
                        var playObj = {
                            title: tab.title,
                            list: []
                        };
                        var list = tab.list;
                        var rlist = [];
                        for (var a  in list ) {
                            var robj = {
                                play: "在线播放b" + (Number(index)+1),
                                title: list[a].title
                            };
                            var $4 = await utils.request(list[a].url, "utf-8");
                            var script = $4(".stui-player__video script");
                            var srt = script[0].children[0].data.replace("var player_data=", "");
                            var url2 = JSON.parse(srt).url;
                            robj.url = url2;
                            rlist.push(robj);
                        }
                        playObj.list=rlist;
                        playlist.push(playObj);
                    }
                    //下载地址
                    var downloadList = [];

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

                    } else {
                        move_id = movelist.data[0]['id'];
                        logger.info("===更新=====");
                        await moveService.update(conn, sets, move_id);
                    }
                    for (var abc = 0; abc < playlist.length; abc++) {
                        var playSourceListUrlsLista = playlist[abc]['list'];
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
                    logger.info("第" + ab + "页=====第" + i + "条======完成");
                } catch (e) {
                    mysql.rollback(conn);
                    console.log(e);
                }
            } catch (e) {
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
