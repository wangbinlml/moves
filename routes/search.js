const express = require('express');
const moment = require('moment');
const elasticsearch = require('elasticsearch');
const mysql = require('../core/mysql');
const router = express.Router();
var client = new elasticsearch.Client({
    host: '192.168.3.120:9200',
    log: 'trace'
});
/* GET search page. */
router.get('/', async function (req, res, next) {
    var pageNum = req.query.page || 1;
    var perPage = req.query.per_page || 10;
    var userQuery = req.query.search_query || "";
    var userId = req.session.userId;
    var moves = [];
    if(!userQuery) {
        res.render('search_es', {
            title: '搜索最新电影',
            msg: "",
            moves: moves,
            search_query: userQuery,
            page: 1,
            pages: 0,
            active: "/",
            user: req.session.user
        });
    } else {
        let body = {
            from: (pageNum - 1) * perPage,
            size: perPage,
            query: {
                match: {"name":userQuery}
            },
            highlight : {
                "pre_tags" : ["<font color='red'>", "<label>"],
                "post_tags" : ["</font>", "</label>"],
                "fields" : {
                    "name" : {}
                }
            }
        };
        const results = await client.search({
            index: 'moves',
            body: body
        });
        moves = results.hits.hits;
        res.render('search_es', {
            title: '搜索最新电影-'+userQuery,
            msg: "",
            moves: moves,
            user: req.session.user,
            active: "/",
            search_query: userQuery,
            page: pageNum,
            pages: Math.ceil(results.hits.total / perPage)
        });
    }
});
module.exports = router;
