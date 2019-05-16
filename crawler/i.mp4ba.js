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
var base_url = "http://www.mp4ba.com";
var url = "http://www.mp4ba.com/dianying/list";
var crawler = function () {
    (async () => {
        //var pageObj = await pageService.findAll();
        var ab = 1;//pageObj.data[0]['page'];
        //列表
        url = url + "_" + ab + ".html";
        //var html = await utils.get(url);
        //var $ = cheerio.load(html, {decodeEntities: false});
        var $ = await utils.request(url,"utf-8");
        var data = $('.content .box .list ul li');
        for (var i = 0; i < data.length; i++) {
            var dt = data[i];
            console.log("第" + ab + "页=====第" + i + "条======");
            var a = dt.children[1].attribs.href;
            var src = "";
            var title = dt.children[1].attribs.title;//+ (hd? "-"+hd: "");
            var detail_url = a;
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
                source: "mp4ba",
                description: "",
                sets: "",
                creator_id: 1
            };
            var actors = [];
            var type = dt.children[0].data.replace("[","").replace("]","").replace(" ","").trim();//类型：动作片，剧情片
            var year = "";//年代
            var area = "";//区域
            var sets = "";//集数
            var content = "";
            var playList = [];

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

            //var detail_html = await utils.get(detail_url);
            //var $2 = cheerio.load(detail_html, {decodeEntities: false});
            var $2 = await utils.request(detail_url,"utf-8");
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                src = $2(".article").find(".info_con").find(".info_detail").find(".cover").find("img").attr("src");
                var duction = $2(".article").find(".info_con").find(".info_detail").find(".duction").text();
                var act_pat = /主演：(\W.*)/;
                var area_pat = /制片国家\/地区：(\W.)/;
                var time_pat = /上映日期：(\w+.*)/;
                var actList = duction.match(act_pat);
                //演员表：
                if(actList.length>0) {
                    var actorList = actList[1].split("/");
                    for (var i = 0; i < actorList.length; i++) {
                        if (actorList[i] != "") {
                            actors.push(actorList[i]);
                        }
                    }
                }
                var areaList = duction.match(area_pat);
                if(areaList.length>0) {
                    area = areaList[1];
                }
                var timeList = duction.match(time_pat);
                if(timeList.length>0) {
                    year = timeList[1].substr(0,4);
                }
                content = $2(".article").find(".info_con").find(".info_detail").children("p").text();
                var images = $2(".article").find(".info_con").find(".ar_banner").find(".swiper-wrapper").find('img');
                images.each(function (ind) {
                    var bannar = $(this);
                    if(ind == 0) {
                        content = content + "<br/><div>" + title + "截图</div>";
                    }
                    content = content + "<img class='detail-img' src = '"+bannar.attr('src')+"'/>";
                });
                moveObj.year = year;
                moveObj.cover = src;
                moveObj.area = area;
                moveObj.sets = sets;

                //下载地址
                var downloadList = [];
                var ui_box = $2(".article").find(".download");
                if (ui_box) {
                    var tabList = [];
                    var menu_tab = ui_box.find('.menu_tab').find('ul').find('li');
                    menu_tab.each(function () {
                        var as = $(this);
                        as.each(function () {
                            var a = $(this);
                            var tabTxt = a.text();
                            if(tabTxt!="全部"){
                                tabList.push(tabTxt);
                            }
                        });
                    });


                    //有问题
                    var download_url = ui_box.find('#fadecon').find('.dow_con');
                    download_url.each(function (index) {
                        if(index>0) {
                            var as = $(this).find('ul').find('li');
                            var as2 = $(this).find('ul').find('li').children('a');
                            var tp = 0;
                            var title2 = as2.text();//集数，或者名字
                            if(tabList[index-1] == "720P") {
                                tp = 2;
                            } else if(tabList[index-1] == "1080P") {
                                tp = 1;
                            } else if(tabList[index-1] == "百度网盘") {
                                tp = 3;
                            }
                            title2 = "["+tabList[index-1] +"]"+ title2;
                            as.each(function () {
                                var tt = title2;
                                var alist = $(this).find('.btn-group').find('a');
                                var p = $(this).find('.btn-group').find('p');
                                if(p && p.text().indexOf("提取码") !=-1){
                                    tt = title2 + "-"+p.text();
                                }
                                alist.each(function () {
                                    var a = $(this);
                                    var href = a.attr("href"); //下载链接
                                    var txt = a.text(); //下载工具label；BT下载
                                    if(href) {
                                        downloadList.push({
                                            title: tt,
                                            type: tp,
                                            url: href
                                        });
                                    }
                                });
                            });
                        }
                    });
                }

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
                        var title = downloadObj.title;
                        var type = downloadObj.type;
                        var exisDownload = await moveDownloadService.findDownloadInfoByType(move_id,title,type);
                        if (exisDownload && exisDownload.data.length > 0) {
                            logger.info("下载链接存在了")
                        } else {
                            await moveDownloadService.insert(conn, [move_id, title, downloadObj.url, downloadObj.type, 1]);
                        }
                    }
                } else {
                    move_id = movelist.data[0]['id'];
                    logger.info("===更新=====");
                    await moveService.update(conn, sets,move_id);
                }
                mysql.commit(conn);
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
