var playUrl = "DVD中字$ftp://a.gbl.114s.com:20320/0637/青鬼.mp4+++BD高清中字$ftp://a.gbl.114s.com:20320/5450/青鬼BD1280高清日语中字.rmvb";
var list = playUrl.split("+++");
for (var pi = 0; pi<list.length;pi++) {
    var pli = list[pi].split("$");
    var title = pli[0];
    var url = pli[1];
    console.log(title+"="+url);
}
