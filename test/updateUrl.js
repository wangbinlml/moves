var mysql = require("../core/mysql");
(async()=>{
    var sql = "select id,url from tb_move_url where url like '%+++%'";
    var result = await  mysql.query(sql);
    console.log(result.length)
    for(let i=0;i<result.length;i++) {
        var url = result[i]['url'];
        var id = result[i]['id'];
        console.log(id+"=="+url);
        let nUrl = url.substr(0,url.indexOf("+++"));
        console.log(nUrl);
        let updateSql = "update tb_move_url set url = '"+nUrl+"' where id="+id;
        console.log(updateSql)
        let rt = await  mysql.query(updateSql)
        console.log(rt)
    }
})();