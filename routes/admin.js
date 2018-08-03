var express = require('express');
var router = express.Router();

var index = require('./backend/index');
var menus = require('./backend/menus');
var roles = require('./backend/roles');
var users = require('./backend/users');
var user_role = require('./backend/user_role');
var menu_role = require('./backend/menu_role');
var login_log = require('./backend/login_log');
var operation_log = require('./backend/operation_log');

//配置路由
router.use('/',index);
router.use('/user',users);
router.use('/users', users);
router.use('/menus', menus);
router.use('/roles', roles);
router.use('/user_role', user_role);
router.use('/menu_role', menu_role);
router.use('/login_log', login_log);
router.use('/operation_log', operation_log);

module.exports = router;
