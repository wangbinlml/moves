const mysql = require('../mysql');
const moment = require('moment');
module.exports.findAll = async () => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_actor where is_del =0");
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};
module.exports.findActorByName = async (actor_name) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_actor where actor_name = ? and is_del =0",actor_name);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取演员失败";
    }
    return result;
};
module.exports.insert = async (conn,value) => {
    return await mysql.query2(conn,"insert into tb_actor (actor_name,avatar,description,creator_id)" +
        "value (?,?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_actor set ";
    if (value.actor_name) {
        sql = sql + "actor_name=?,"
    }
    if (value.avatar) {
        sql = sql + "avatar=?,"
    }
    if (value.description) {
        sql = sql + "description=?,"
    }
    sql = sql + "updated_at=?,";
    sql = sql + "updated_user_id=?)";
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_actor set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};