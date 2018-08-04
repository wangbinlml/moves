const mysql = require('../mysql');
const Pagination = require('../Pagination');
const moment = require('moment');
module.exports.findAll = async (currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where is_del =0",
                "select * from tb_move where is_del=0 order by year desc,created_at desc limit ?,?"], currrent_page, num);
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
            ["select count(*) count from tb_move where  tag_id = " + tag_id + " and is_del =0",
                "select * from tb_move where tag_id = " + tag_id + " and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
module.exports.findAllMoves = async (category, currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where  category_id = " + category + " and is_del =0",
                "select * from tb_move where category_id = " + category + " and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
module.exports.search = async (keyword, currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where name like '%" + keyword + "%' and is_del =0",
                "select * from tb_move where name like '%" + keyword + "%' and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
module.exports.findMovesByArea = async (area, currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where area = '" + area + "' and is_del =0",
                "select * from tb_move where area = '" + area + "' and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
module.exports.findMovesByTagId = async (tag_id, currrent_page, num) => {
    let result = {};
    try {
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where tag_id = '" + tag_id + "' and is_del =0",
                "select * from tb_move where tag_id = '" + tag_id + "' and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
module.exports.findAllArea = async () => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select count(*) count, area from tb_move where is_del =0 group by area order by count desc, area asc limit 0,15");
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findOne = async (move_id) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where id = ? and is_del =0", move_id);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findRelationMoves = async (tag_id, area, offset) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where tag_id = ? and area=? and is_del =0 limit 0,?", [tag_id,area,offset]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findMostViewsMoves = async (tag_id, area, offset) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where tag_id = ? and area = ? and is_del =0 order by views desc limit 0,?", [tag_id,area, offset]);
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
        result.data = await mysql.query("select * from tb_move where name = ? and is_del =0", actor_name);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findMoveToday = async (start_time, end_time, count) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where created_at >= ? and created_at<= ? and is_del =0 order by created_at desc limit ?", [start_time, end_time, count]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findMoveTops = async (count) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where top=1 and is_del =0 order by created_at desc limit 0,?", count);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.insert = async (conn, value) => {
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
