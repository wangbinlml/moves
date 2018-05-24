const mysql = require('../mysql');
const moment = require('moment');
module.exports.findMoveTagRalation = async (move_id,tag_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_tag where move_id = ? and tag_id =?", [move_id,tag_id]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取标签失败";
    }
    return result;
};
module.exports.insert = async (conn,value) => {
    return await mysql.query2(conn, "insert into tb_move_tag (move_id,tag_id)" +
        "value (?,?)", value);
};
module.exports.delete = async (move_id,tag_id) => {
    var sql = "delete from tb_move_tag where move_id=? where tag_id = ?";
    return await mysql.query(sql, [move_id,tag_id]);
};