var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require('log4js');
var commonUtil = require('./core/util/commonUtil');
var systemConfig = require(commonUtil.getConfigPath() + "/system_config");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redisClient = require("./core/util/RedisUtils");
var log = require('./core/logger').getLogger("system");

var fs = require('fs');
var markdown = require('markdown-js');
var routes = require('./routes/index');
var move = require('./routes/move');
var login = require('./routes/login');
var contactUs = require('./routes/contact-us');
var downloads = require('./routes/downloads');
var menu_auth = require("./routes/backend/menu_auth");
var verify = require('./routes/verify');
var admin = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(log4js.connectLogger(log4js.getLogger("express")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session超时时间，单位：分钟
var timeout_minute = systemConfig.session_time_out_minute || 120;
app.use(session({
    secret: 'express',
    store: new RedisStore({
        client: redisClient.Redis,
        prefix: "admin_session_",
        ttl: timeout_minute * 60 // 过期时间
    }),
    resave: true,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
    if (req.session == undefined) {
        var str = "无法获取session（cookie），确保redis是否连接正常。";
        log.error(str);
        res.render("notice", {msg: str});
        return;
    }  else if (is_login(req)) {
        res.render("login", {msg: '您未登录或登录已超时！'});
        return;
    } else if (menu_auth.check(req) == false) {
        res.status(401);
        res.render('backend/401', {
            message: "没有权限访问该页面",
            error: {}
        });
        return;
    }
    next();
});

app.use('/', routes);
app.use('/contact-us', contactUs);
app.use('/downloads', downloads);
app.use('/move', move);
app.use('/login', login);
app.use('/verify', verify);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render('404');
  next();
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
app.engine('md', function(path, options, fn){
    fs.readFile(path, 'utf8', function(err, str){
        if (err) return fn(err);
        str = markdown.parse(str).toString();
        fn(null, str);
    });
});
function is_login(req) {
    if (req.url.indexOf("/admin") == 0 && !req.session.user) {
        return true;
    }
    return false;
}

module.exports = app;
