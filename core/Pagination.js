const mysql = require('./mysql');
module.exports.getData= async (sql, current_page, num) => {
    current_page = (current_page && parseInt(current_page)) || 1; //默认为1
    num = num || 10; //一页条数
    var last_page = current_page - 1;
    if (current_page <= 1) {
        last_page = 1;
    }
    var next_page = current_page + 1;
    var start = (current_page - 1) * num;
    //var sql = 'SELECT COUNT(*) FROM record; SELECT * FROM record limit ' + start + ',20';
    var results = await mysql.query(sql[1], [start, num]);
    var count = await mysql.query(sql[0]);

    // 计算总页数
    var allCount = count[0]['count'];
    var allPage = parseInt(allCount) / 20;
    var pageStr = allPage.toString();
    // 不能被整除
    if (pageStr.indexOf('.') > 0) {
        allPage = parseInt(pageStr.split('.')[0]) + 1;
    }
    return {
        total_pages: allPage,
        last_page: last_page,
        current_page: current_page,
        data: results
    }
};