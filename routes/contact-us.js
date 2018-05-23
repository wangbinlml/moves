var express = require('express');
var router = express.Router();

/* GET contact-us listing. */
router.get('/', function (req, res, next) {
    var data = {
        user: req.session.user,
        title: '电影-关于我们',
        msg: "",
        active: "contact-us"
    };
    res.render('contact-us',data);
});

module.exports = router;
