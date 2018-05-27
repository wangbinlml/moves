const mysql = require('../mysql');
const moment = require('moment');
module.exports.findAll = async () => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_category where is_del =0");
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};
module.exports.findCategory = async (category_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_category where id=? and is_del =0", category_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取类型失败";
    }
    return result;
};
module.exports.insert = async (value) => {
    return await mysql.query("insert into tb_category (parent_id,name,cover,creator_id)" +
        "value (?,?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_category set ";
    if (value.parent_id) {
        sql = sql + "parent_id=?,";
    }
    if (value.name) {
        sql = sql + "name=?,"
    }
    if (value.cover) {
        sql = sql + "cover=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_category set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};