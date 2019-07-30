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
var url = "https://v.blueghost.cn/index.php/vod/type/id/1/page/";
var crawler = function () {
    (async () => {
        var moves = await moveUrlService.findMoveByLikeName("http://jx.du2.cc");
        for (var index in moves.data) {
            var move = moves.data[index];
            var id = move.id;
            var url = move.url.split("=");
            var newUrl = decodeURIComponent(url[1].split(".html")[0])+".html";
            await moveUrlService.updateUrl(newUrl, id);
            console.log(id,newUrl)
        }
        process.exit(0);
    })();
};
//schedule.scheduleJob('*/3 * * * *', function(){
//while (true) {
    logger.info("=====================" + new Date() + "======================");
    crawler();
//}
//});
