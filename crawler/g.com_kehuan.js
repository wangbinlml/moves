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
var base_url = "http://yiybb.com";
var url = "http://yiybb.com/kh/";
var crawler = function () {
    (async () => {
        /var pageObj = await pageService.findAll(4);
        var ab =pageObj.data[0]['page'];
        //列表
        if (ab == 1) {
            url = url + "Index.html";
        } else {
            url = url + "List_5_" + ab + ".html";
        }
        var $ = await utils.request(url);
        var data = $('.border li p');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            if(dt.children[0].children == undefined || dt.children[0].children[0] == undefined) {
                continue;
            }
            console.log("第" + ab + "页=====第" + i + "条======");
            var a = dt.children[0].attribs.href;
            var src = dt.children[0].children[0].attribs.src;
            var title = dt.children[0].attribs.title;
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
                source: "yiybb",
                description: "",
                sets: "全集",
                creator_id: 1
            };
            var actors = [];
            var type = "1";//类型：动作片，剧情片
            var year = "";//年代
            var area = "";//区域
            var sets = "";//集数
            var content = "";
            var playList = [];

            var $2 = await utils.request(detail_url);
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var $5 = $2(".content .movie ul li");
                var p = $2(".content .movie ul").find("li");
                p.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //导演
                    } else if (index == 1) {
                        //演员表：
                        var actorList = chapter.find("a");
                        actorList.each(function (a, al) {
                            if ($(this).text() != "") {
                                actors.push($(this).text());
                            }
                        });
                    } else if (index == 4) {
                        //类型： 【年　代】：2018  【地　区】：欧美
                        type = chapter.text();
                        var str = chapter.text();//类型：动作片 年代：2018  地区：中国 更新：2018-05-19
                        var list = str.split("【地　区】：");
                        for (var k = 0; k < list.length; k++) {
                            if (list[k] != "") {
                                var typeItem = list[k].split("：");
                                if (k == 0) {
                                    //年代：2018
                                    year = typeItem[1];
                                    year = year.replace("【年　代】：", "");
                                }
                                if (k == 1) {
                                    //地区：中国
                                    area = typeItem[0];
                                }
                            }
                        }
                    }
                });
                if(year == "" || year.trim() == "未知") {
                    year = "2012";
                }
                if(area == "" || area.trim() == "未知") {
                    area = "其它";
                }
                moveObj.year = year;
                moveObj.area = area;
                moveObj.sets = sets;

                //网盘链接：
                var div = $2("#nr_if #div");
                //播放地址
                var playObjList = [];
                var playurlm = $2(".player");
                playurlm.each(function (a, b) {
                    var playName = $(this).find("h4").text();
                    var playUrls = $2(".p_ll").eq(a).find("li").find("a");
                    var links = [];
                    playUrls.each(function (e, f) {
                        var href = $(this).attr("href");
                        var text = $(this).text();
                        links.push({
                            href: href,
                            text: text
                        })
                    });
                    playObjList.push({
                        title: playName,
                        links: links
                    })
                });

                function ____e() {
                    return "0123456789,ABCDEFG,HIJKLMN,OPQRST,UVWXYZ,abcdefg,hijklmn,opqrst,uvwxyz"
                }

                function ____d() {
                    return "4560123987,GFEDCBA,MHIJLNK,PQRSTO,ZUVWXY,gfedcba,mhijlnk,pqrsto,zuvwxy"
                }

                function set_code(s, en, isN) {
                    var e_s = en ? ____e() : ____d(), d_s = en ? ____d() : ____e(), str = "";
                    e_s = isN ? e_s.split(",")[0] : e_s, d_s = isN ? d_s.split(",")[0] : d_s;
                    for (var i = 0; i < s.length; i++) {
                        n = -1;
                        n = e_s.indexOf(s.charAt(i));
                        if (n != -1) {
                            str += d_s.charAt(n)
                        } else {
                            str += s.charAt(i)
                        }
                    }
                    return str
                };

                for (var j = 0; j < playObjList.length; j++) {
                    var source = "";
                    var titlePlay = playObjList[j];
                    if (titlePlay.title.indexOf('快播')==0 || titlePlay.title.indexOf("吉吉影音")==0 || titlePlay.title.indexOf("西瓜影音")==0){
                        logger.info("=========快播===吉吉影音====西瓜影音======")
                        continue;
                    }
                    for (var uu = 0; uu < titlePlay.links.length; uu++) {
                        var play_url = base_url + titlePlay.links[uu].href;
                        var $3 = await utils.request(play_url);
                        var htmlPa = $3(".play_1").find("script").eq(0).html();
                        var reg2 = /unescape\("(\w+.*?)"/g;
                        var result2 = reg2.exec(htmlPa);
                        var idUrl = set_code(unescape(result2[1], 0, 0));

                        var jsUrl = base_url + "/" + $3(".play_1").find("script").eq(1).attr("src");
                        var $4 = await utils.request(jsUrl);
                        var iframeHtml = $4.html();
                        var reg = /src=\"(\S+url)/g;
                        var result = reg.exec(iframeHtml);
                        var iframeUrl = result[1].replace("'+url", idUrl);
                        if (iframeUrl.indexOf("http") != 0) {
                            iframeUrl = base_url + iframeUrl;
                        }
                        var $6 = await utils.request(iframeUrl);
                        var video = $6("#a1").find("video").attr("src");
                        var iframe = $6("#a1").find("iframe").attr("src");

                        playList.push({
                            play: titlePlay.title,//播放器
                            title: titlePlay.links[uu].text,
                            url: iframeUrl
                        });

                    }
                }

                //下载地址
                var downloadList = [];
                var ui_box = $2(".download ul li");
                if (ui_box) {
                    ui_box.each(function (a,b) {
                        var li = $(this);
                        var txt = "", href="";
                        var spans = li.find('span');
                        spans.each(function (e,f) {
                            var spp = $(this);
                            if(e == 0) {
                                txt = spp.text();
                            } else if (e == 1) {
                                href = spp.find('input').eq(0).attr("value")
                            }
                        });
                        downloadList.push({
                            title: txt,
                            url: href
                        });
                    });
                }
                var contentHtml = $2(".inst .content2");
                contentHtml.find("a").remove();
                content = contentHtml.html().replace("本片在线观看由ck电影网(为您提供","");
                if (playList.length > 0) {
                    var description = StringUtils.htmlEncodeByRegExp(content);
                    var move_id = "";
                    if (exits == false) {
                        moveObj = await moveService.insert2(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.sets, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                        move_id = moveObj.insertId;
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


                    } else {
                        move_id = movelist.data[0]['id'];
                        logger.info("===更新=====");
                        await moveService.update(conn, sets, move_id);
                    }

                    for (var f = 0; f < downloadList.length; f++) {
                        var downloadObj = downloadList[f];
                        var actorObj = await moveDownloadService.findDownloadInfo(move_id,downloadObj.title);
                        if (actorObj && actorObj.data.length == 0) {
                            await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url, 1]);
                        }
                    }
                    /*for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                    }*/

                    for (var r = 0; r < playList.length; r++) {
                        var playObj = playList[r];
                        logger.info("====第" + ab + "页保存" + playObj.play + playObj.title + "=====")
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
        await pageService.update(4);
        process.exit(0);
    })();
};
//schedule.scheduleJob('*/1 * * * *', function(){
//while (true) {
logger.info("=====================" + new Date() + "======================");
crawler();
//}
//});
