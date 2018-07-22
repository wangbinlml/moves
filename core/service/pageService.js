const mysql = require('../mysql');
const moment = require('moment');
module.exports.findAll = async () => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from page");
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};
module.exports.update = async () => {
    var sql = "update page set page=page-1";
    return await mysql.query(sql);
};