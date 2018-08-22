const mysql = require('../mysql');
const moment = require('moment');
module.exports.findAll = async (id) => {
    id = id || 1;
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from page where id=?",id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};
module.exports.update = async (id) => {
    id = id || 1;
    var sql = "update page set page=page-1 where id = ?";
    return await mysql.query(sql,id);
};

module.exports.increment = async (id) => {
    id = id || 1;
    var sql = "update page set page=page+1 where id = ?";
    return await mysql.query(sql,id);
};