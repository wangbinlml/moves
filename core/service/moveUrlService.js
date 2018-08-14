const mysql = require('../mysql');
const moment = require('moment');
module.exports.findMoveUrl = async (move_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_url where move_id = ? and is_del =0 order by player asc,name desc", move_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取播放url失败";
    }
    return result;
};
module.exports.findMoveByName = async (move_id,name, player) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_url where move_id=? and name = ? and player=? and is_del =0", [move_id,name,player]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取播放url失败";
    }
    return result;
};
module.exports.findMoveUrlByMoveIdAndPlayer = async (id, move_id, player) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_url where id=? and move_id = ? and player = ? and is_del =0", [id, move_id,player]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取播放url失败";
    }
    return result;
};
module.exports.insert = async (conn, value) => {
    return await mysql.query2(conn, "insert into tb_move_url (move_id,name,url,player,creator_id)" +
        "value (?,?,?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_move_url set ";
    if (value.move_id) {
        sql = sql + "move_id=?,";
    }
    if (value.name) {
        sql = sql + "name=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_move_url set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};