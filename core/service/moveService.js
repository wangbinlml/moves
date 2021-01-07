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
            ["select count(*) count from tb_move where tag_id = " + tag_id + " and is_del =0",
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
module.exports.findNewsMoves = async (category_id, num) => {

    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where category_id=? and is_del =0 order by created_at desc limit ?", [category_id, num]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取失败";
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
module.exports.search = async (keywords, currrent_page, num) => {
    let result = {};
    try {
        let where = "";
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            if (i == 0) {
                where = "name like '%" + keyword + "%'";
            } else {
                where = where + " or name like '%" + keyword + "%'";
            }
        }
        const data = await Pagination.getData(
            ["select count(*) count from tb_move where (" + where + ") and is_del =0",
                "select * from tb_move where (" + where + ") and is_del=0 order by created_at desc limit ?,?"], currrent_page, num);
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
        result.data = await mysql.query("select * from tb_move where tag_id = ? and area=? and is_del =0 order by created_at desc limit 0,? ", [tag_id,area,offset]);
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
module.exports.findMoveTodayUpdate = async (start_time, count) => {
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where updated_at >= ? and is_del =0 order by updated_at desc limit ?", [start_time, count]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取电影失败";
    }
    return result;
};
module.exports.findMoveTops = async (count,category_id) => {
    category_id = category_id || "1";
    let result = {};
    try {
        result.error = 0;
        result.msg = "";
        result.data = await mysql.query("select * from tb_move where category_id=? and top=1 and is_del =0 order by created_at desc limit 0,?", [category_id,count]);
    } catch (e) {
        console.log(e);
        result.error = 1;
        result.msg = "获取失败";
    }
    return result;
};
module.exports.insert = async (conn, value) => {
    return await mysql.query2(conn, "insert into tb_move (category_id,tag_id,name,year,area,cover,source,description,creator_id)" +
        "value (?,?,?,?,?,?,?,?,?)", value);
};
module.exports.insert2 = async (conn, value) => {
    return await mysql.query2(conn, "insert into tb_move (category_id,tag_id,name,year,area,sets,cover,source,description,creator_id)" +
        "value (?,?,?,?,?,?,?,?,?,?)", value);
};
module.exports.update = async (conn, sets,id, name) => {
    var sql = "update tb_move set updated_at=?,sets=? ";
        if (name && name !="") {
            sql = sql + ",name='"+name+"'";
        }
    sql = sql + " where id=?";
    return await mysql.query2(conn, sql, [new Date(),sets,id]);
};
module.exports.delete = async (id) => {
    var sql = "update tb_move set is_del=1 where id = ?";
    return await mysql.query(sql, id);
};
