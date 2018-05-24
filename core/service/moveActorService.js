const mysql = require('../mysql');
const moment = require('moment');
module.exports.insert = async (conn, value) => {
    return await mysql.query2(conn,"insert into tb_move_actor (move_id,actor_id)" +
        "value (?,?)", value);
};
module.exports.delete = async (value) => {
    var sql = "delete from tb_move_actor where move_id=? and actor_id = ?";
    return await mysql.query(sql, value);
};