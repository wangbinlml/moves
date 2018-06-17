//依赖模块
var fs = require('fs');
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

var base_url = "http://www.84dm.com";
//动作
var url = "http://www.84dm.com/type/1/2.html";
(async () => {
    //到50页
        //列表
        var html = await utils.get(url);
        var $ = cheerio.load(html, {decodeEntities: false});
        var data = $('.movie-item a');
        for (var i = 0; i < data.length; i++) {
            var conn = await mysql.getConnection();
            mysql.beginTransaction(conn);
            try {
                var dt = data[i];
                var a = dt.attribs.href;
                if(dt.children[1] == undefined) {
                    continue;
                }
                console.log("=====第" + i + "条======");
                var src = dt.children[1].attribs.src;
                var hd = $('.mov_list li').eq(i).find("font").html();
                var title = dt.children[1].attribs.title+ (hd? "-"+hd: "");
                var detail_url = base_url + a;
                var movelist = await moveService.findMoveByName(title);
                if (movelist && movelist.data.length > 0) {
                    console.log("===" + title + "已经存在里");
                    continue;
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

                var detail_html = await utils.get(detail_url);
                var $2 = cheerio.load(detail_html, {decodeEntities: false});

                var $5 = $2(".col-md-8");
                var p = $2(".col-md-8 table tr");
                p.each(function (index, item) {
                    var chapter = $(this);
                    if (index == 0) {
                        //导演
                        var daoyan = chapter.find("td");
                    } else if (index == 1) {
                        //演员表：
                        var actorList = chapter.find("td").eq(1);
                        actorList.each(function (a, al) {
                            var actorString = $(this).text();
                            if (actorString != "") {
                                var actorArray = actorString.split("/");
                                for (var aa = 0; aa < actorArray.length; aa++) {
                                    if(actorArray[aa].trim()!=""){
                                        actors.push(actorArray[aa].trim());
                                    }
                                }
                            }
                        });
                    } else if (index == 3) {
                        //国家
                        var areaList = chapter.find("td").eq(1);
                        areaList.each(function (a, al) {
                            var areaString = $(this).text();
                            if (areaString != "") {
                                var areaArray = areaString.split("/");
                                if(areaArray.length>0 && areaArray[0].trim()!=""){
                                    area = areaArray[0].trim();
                                }
                            }
                        });
                    } else if (index == 5) {
                        //上映日期
                        var yearList = chapter.find("td").eq(1);
                        yearList.each(function (a, al) {
                            var yearString = $(this).text();
                            if (yearString != "") {
                                var yearArray = yearString.split("/");
                                if(yearArray.length>0 && yearArray[0].trim()!=""){
                                    year = yearArray[0].trim();
                                    year = year.substring(0,4);
                                }
                            }
                        });
                    } else if (index == 2) {
                        //类型：
                        var typeList = chapter.find("td").eq(1);
                        typeList.each(function (a, al) {
                            var typeString = $(this).text();
                            if (typeString != "") {
                                var typeArray = typeString.split("/");
                                if(typeArray.length>0 && typeArray[0].trim()!=""){
                                    type = typeArray[0].trim();
                                }
                            }
                        });
                    }
                });
                if(type+"片" == "动作片") {
                    moveObj.tag_id = 1;
                } else if(type+"片" == "科幻片") {
                    moveObj.tag_id = 2;
                }else if(type+"片" == "剧情片") {
                    moveObj.tag_id = 3;
                } else if(type+"片" == "喜剧片") {
                    moveObj.tag_id = 4;
                }else if(type+"片" == "恐怖片") {
                    moveObj.tag_id = 5;
                }

                moveObj.area = area;
                moveObj.year = year;
                var flag = true;
                //网盘链接：
                //无
                //播放地址
                var playurlm = $2(".dslist-group");
                if (playurlm) {
                    var linkP = [];
                    var playLi = playurlm.find("li");
                    playLi.each(function () {
                        var liItem = $(this);
                        var liItemA = liItem.find("a");
                        linkP.push({
                            title: liItemA.text(),
                            link: liItemA.attr('href')
                        });
                    });
                    for (var j = 0; j < linkP.length; j++) {
                        var source = "";
                        var titlePlay = "iframe";
                        var linkPlay = linkP[j];
                        var play_url = base_url + linkPlay.link;
                        var play_html = await utils.get(play_url);
                        var $3 = cheerio.load(play_html, {decodeEntities: false});
                        var script = $3("iframe").attr("src");
                        if(script.indexOf("https")>-1){
                            play_html = await httpUtils.get2(script);
                            console.log("==========https============");
                            flag = true;
                        }else {
                            play_html = await utils.get(script);
                        }
                        var $4 = cheerio.load(play_html, {decodeEntities: false});
                        script = $4("iframe").attr("src");
                        /*play_html = await utils.get(script);
                        var $5 = cheerio.load(play_html, {decodeEntities: false});
                        var id = script.substring(script.indexOf("?id=")+4);
                        var md5 = $5("#hdMd5").attr("value");
                        var cdnip = await httpUtils.get2("https://data.video.iqiyi.com/v.mp4");
                        var sip = cdnip.match(/https:\/\/([^\"]*)\/v.mp4/);
                        var iqiyicip = sip[1];
                        var pUrl = base_url + "";
                        var objData = {
                            "id": id,
                            "type": "auto",
                            "siteuser": '',
                            "md5": md5,
                            "hd":"",
                            "lg":"",
                            "cip":"CN",
                            "iqiyicip":iqiyicip
                        };
                        const postData = querystring.stringify(objData);

                        const options = {
                            hostname: 'www.84dm.com',
                            port: 80,
                            path: '/url.php',
                            method: 'POST'
                        };
                        var getiqiyicip = await httpUtils.request(options,postData);
*/
                        playList.push({
                            play: titlePlay,//播放器
                            title: linkPlay.title,
                            url: script
                        });
                    }
                }

                //下载地址
                var downloadList = [];
                $5.children("table").remove();
                var htm = $5.html();//.replace(/\n/g,"");
                if (htm.indexOf("</a>") > 0) {
                    htm = htm.substr(htm.indexOf("</a>") + 4);
                }
                var description = StringUtils.htmlEncodeByRegExp(htm);
                var tag_id = moveObj.tag_id;
                moveObj = await moveService.insert(conn, [moveObj.category_id, moveObj.tag_id, moveObj.name, year, area, moveObj.cover, moveObj.source, description, moveObj.creator_id]);
                var move_id = moveObj.insertId;
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
                for (var r = 0; r < playList.length; r++) {
                    var playObj = playList[r];
                    await moveUrlService.insert(conn, [move_id, playObj.title, playObj.url, playObj.play, 1]);
                }

                for (var f = 0; f < downloadList.length; f++) {
                    var downloadObj = downloadList[f];
                    await moveDownloadService.insert(conn, [move_id, downloadObj.title, downloadObj.url, 1]);
                }

                mysql.commit(conn);
                console.log("=====第" + i + "条======完成");
            } catch (e) {
                mysql.rollback(conn);
                console.log(e);
            }
        }
    process.exit(0);
})();