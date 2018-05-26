const mysql = require('../mysql');
const Pagination = require('../Pagination');
const moment = require('moment');
module.exports.findAll = async (currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where is_del =0",
                "select * from tb_move where is_del=0 order by created_at desc limit ?,?"], currrent_page,num);
        result.error = 0;
        result.msg = "";
        result.data = data;
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};
module.exports.findMoves = async (tag_id, currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where  tag_id = "+tag_id+" and is_del =0",
                "select * from tb_move where tag_id = "+tag_id+" and is_del=0 order by created_at desc limit ?,?"], currrent_page,num);
        result.error = 0;
        result.msg = "";
        result.data = data;
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取列表失败";
    }
    return result;
};

module.exports.findOne = async (move_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where id = ? and is_del =0",move_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findMoveByName = async (actor_name) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where name = ? and is_del =0",actor_name);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.insert = async (conn, value) => {
    console.log("===move=======", value);
    return await mysql.query2(conn, "insert into tb_move (category_id,tag_id,name,year,area,cover,source,description,creator_id)" +
        "value (?,?,?,?,?,?,?,?,?)", value);
};
module.exports.update = async (value) => {
    var sql = "update tb_move set ";
    if (value.category_id) {
        sql = sql + "category_id=?,";
    }
    if (value.tag_id) {
        sql = sql + "tag_id=?,"
    }
    if (value.name) {
        sql = sql + "name=?,"
    }
    if (value.cover) {
        sql = sql + "cover=?,"
    }
    if (value.source) {
        sql = sql + "source=?,"
    }
    if (value.category_id) {
        sql = sql + "description=?,"
    }
    if (value.description) {
        sql = sql + "updated_at=?,";
        sql = sql + "updated_user_id=?)";
    }
    return await mysql.query(sql, value);
};
module.exports.delete = async (id) => {
    var sql = "update tb_move set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};