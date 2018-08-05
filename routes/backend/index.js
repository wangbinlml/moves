var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('backend/index', {
        user: req.session.user,
        menus: req.session.menus,
        menu_active: req.session.menu_active['/admin'] || {},
        title: '首页'
    });
});

module.exports = router;
