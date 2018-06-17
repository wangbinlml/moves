const mysql = require('../mysql');
const moment = require('moment');
module.exports.findTagByName = async (name) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_tag where tag_name = ? and is_del =0", name);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取失败";
    }
    return result;
};
module.exports.findTagById = async (id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_tag where id = ? and is_del =0", id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取失败";
    }
    return result;
};
module.exports.insert = async (value) => {
    return await mysql.query("insert into tb_tag (tag_name,creator_id)" +
        "value (?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_tag set ";
    if (value.tag_name) {
        sql = sql + "tag_name=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_tag set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};