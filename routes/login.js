const express = require('express');
const router = express.Router();
const stringUtils = require("../core/util/StringUtils");
const mysql = require('../core/mysql');
const common = require("../core/common");

/* GET home page. */
router.get('/', (req, res, next) => {
    const user = req.session && req.session.user;
    if (user) {
        res.redirect("/");
    }
    res.render('login', {title: 'Login', msg: "请输入您的用户名和密码"});
});
router.get('/exit', (req, res, next) => {
    req.session.destroy(function (err) {
        if (err) {
            console.error("--> session destroy failed.err -> ", err);
        }
    });
    res.redirect("/");
});
/* POST */
router.post("/", async (req, res, next) => {
    console.log(req.body)
    var username = req.body.username;
    var password = req.body.password;
    var is_remember = req.body.is_remember;
    var sql = "select * from bs_user where user_name=? and password = ?";
    var users = await mysql.query(sql, [username, stringUtils.createPassword(password)]);
    if (users.length > 0) {
        var user = users[0];
        req.session.user = user;
        // session中设置菜单
        await common.saveLoginLog(req);
        if (is_remember) {
            res.cookie("login.username", username, {
                // 默认有效期为10年
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10
            });
        }
        res.redirect("/");
    } else {
        res.status(200).json({error: 1, msg: "用户名或者密码错误"});
    }
});
module.exports = router;
