const mysql = require('../mysql');
const moment = require('moment');
module.exports.findDownloadUrl = async (move_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_tag where move_id = ? and is_del =0", move_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取演员失败";
    }
    return result;
};
module.exports.insert = async (value) => {
    return await mysql.query("insert into tb_move_tag (move_id,tag_name,creator_id)" +
        "value (?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_move_tag set ";
    if (value.move_id) {
        sql = sql + "move_id=?,";
    }
    if (value.tag_name) {
        sql = sql + "tag_name=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_move_download set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};