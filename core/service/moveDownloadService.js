const mysql = require('../mysql');
const moment = require('moment');
module.exports.findDownloadUrl = async (move_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_download where move_id = ? and is_del =0", move_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取下载链接失败";
    }
    return result;
};
module.exports.findDownloadInfo = async (move_id, name) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_download where move_id = ? and name=? and is_del =0", [move_id,name]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取下载链接失败";
    }
    return result;
};
module.exports.findDownloadInfoByType = async (move_id, name,type) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move_download where move_id = ? and name=? and type=? and is_del =0", [move_id,name,type]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取下载链接失败";
    }
    return result;
};

module.exports.insert = async (conn,value) => {
    return await mysql.query2(conn, "insert into tb_move_download (move_id,name,download_address,type,creator_id)" +
        "value (?,?,?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_move_download set ";
    if (value.move_id) {
        sql = sql + "move_id=?,";
    }
    if (value.name) {
        sql = sql + "name=?,"
    }
    if (value.download_address) {
        sql = sql + "download_address=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_move_download set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};