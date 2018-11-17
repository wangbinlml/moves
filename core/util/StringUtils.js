var crypto = require("crypto");
var fs = require("fs");
var getIP = require('ipware')().get_ip;
const httpUtils = require('./HttpUtils');
var key = 'OxLYdFmu3YS1haMUcaBmGMBK0P7PbOqb'; //百度api的key

// 用户头像背景色
var HEAD_COLOR_ARR = [
    "#f4a739",
    "#f9886d",
    "#6fb7e7",
    "#8ec566",
    "#f97c94",
    "#bdce00",
    "#f794be",
    "#7ccfde",
    "#b0a1d3",
    "#ff9c9c",
    "#80e2c5",
    "#eebd93",
    "#b4beef",
    "#f1aea8",
    "#9abfdf",
    "#ed8aa6",
    "#e2d240",
    "#e97984",
    "#acd3be",
    "#d8a7ca",
    "#98da8e",
    "#eeaa93",
    "#f7ae4a",
    "#fcca4d",
    "#e8c707",
    "#f299af",
    "#94ca76",
    "#c4d926",
    "#d6c7b0",
    "#a1d8ef"
];
var PASSWORD_SALT = "njxtqgjyptfromlianchuang";

var SYSTEM_PASSWORD_SALT = "hbb_bs_2016";

/**
 * 根据指定字符串生成加密后的密码<br />
 * 加密方式:将密码+固定盐值（SALT）先进行md5得到二进制字节数组后再进行Base64加密得到密文结果
 * @param password 明文密码
 * @returns 加密密码
 */
module.exports.generatePassword = function (password) {
    return crypto.createHash("md5").update(password + PASSWORD_SALT).digest("base64");
};


/**
 * 随机生成头像背景色
 * @returns {string}背景色
 */
module.exports.generateHeadColor = function () {
    return HEAD_COLOR_ARR[Math.floor(Math.random() * HEAD_COLOR_ARR.length)];
};


/**
 * 根据指定的字符串生成本系统所需加密密码
 * @param str 字符串
 * @returns {string}加密密码
 */
module.exports.createPassword = function (str) {
    return crypto.createHash("md5").update(str + SYSTEM_PASSWORD_SALT).digest("base64");
};


module.exports.md5 = function (text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
module.exports.getReqRemoteIp = function (req) {
    const ipInfo = getIP(req);
    return ipInfo.clientIp.replace("::ffff:", "");
};
module.exports.getLocations = async function (ip) {
    var ip = ip ? ip.replace("::ffff:", "") : "";
    if (ip) {
        var options = {
            hostname: 'api.map.baidu.com',
            port: 80,
            path: '/location/ip?ak=' + key + "&coor=bd09ll&ip=" + ip,
            method: 'GET'
        };
        // 向远程服务器端发送请求
        var str = await httpUtils.request(options, "");
        var locations = JSON.parse(str);
        if (locations.status == 0) {
            return JSON.stringify(locations);
        }
        return "";
    } else {
        return "";
    }
};

/*3.用正则表达式实现html转码*/
module.exports.htmlEncodeByRegExp = function (str){
    var s = "";
    if(str.length == 0) return "";
    s = str.replace(/&/g,"&amp;");
    s = s.replace(/</g,"&lt;");
    s = s.replace(/>/g,"&gt;");
    s = s.replace(/ /g,"&nbsp;");
    s = s.replace(/\'/g,"&#39;");
    s = s.replace(/\"/g,"&quot;");
    return s;
}
/*4.用正则表达式实现html解码*/
module.exports.htmlDecodeByRegExp = function (str){
    var s = "";
    if(str.length == 0) return "";
    s = str.replace(/&amp;/g,"&");
    s = s.replace(/&lt;/g,"<");
    s = s.replace(/&gt;/g,">");
    s = s.replace(/&nbsp;/g," ");
    s = s.replace(/&#39;/g,"\'");
    s = s.replace(/&quot;/g,"\"");
    return s;
}


/**
 * 将str中的html符号转义,将转义“'，&，<，"，>”五个字符
 * @method unhtml
 * @param { String } str 需要转义的字符串
 * @return { String } 转义后的字符串
 * @example
 * ```javascript
 * var html = '<body>&</body>';
 *
 * //output: &lt;body&gt;&amp;&lt;/body&gt;
 * console.log( UE.utils.unhtml( html ) );
 *
 * ```
 */
module.exports.unhtml=function (str, reg) {
    return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp|#\d+);)?/g, function (a, b) {
        if (b) {
            return a;
        } else {
            return {
                '<':'&lt;',
                '&':'&amp;',
                '"':'&quot;',
                '>':'&gt;',
                "'":'&#39;'
            }[a]
        }

    }) : '';
};

/**
 * 将str中的转义字符还原成html字符
 * @see UE.utils.unhtml(String);
 * @method html
 * @param { String } str 需要逆转义的字符串
 * @return { String } 逆转义后的字符串
 * @example
 * ```javascript
 *
 * var str = '&lt;body&gt;&amp;&lt;/body&gt;';
 *
 * //output: <body>&</body>
 * console.log( UE.utils.html( str ) );
 *
 * ```
 */
module.exports.html=function (str) {
    return str ? str.replace(/&((g|l|quo)t|amp|#39|nbsp);/g, function (m) {
        return {
            '&lt;':'<',
            '&amp;':'&',
            '&quot;':'"',
            '&gt;':'>',
            '&#39;':"'",
            '&nbsp;':' '
        }[m]
    }) : '';
};
