/**
 * Description:
 * Created by wangbin.
 * Date: 16-6-23
 * Time: 下午5:28
 */
var fs = require('fs');
var http = require('http');
var https = require('https');
var originRequest = require("request");
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
};
var headers2 = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
};
var request = function (url, charset, cb) {
    // 发送请求
    var options = {
        url: url,
        encoding: null,
        headers: headers
    };
    if (typeof cb == "function") {
        originRequest(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {// 发送请求
                var html = iconv.decode(body, charset || 'gb2312');
                var $ = cheerio.load(html, {decodeEntities: false});
                cb(null, $)
            } else {
                cb(error, null);
            }
        });
    } else {
        return new Promise(function (resolve, reject) {
            originRequest(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {// 发送请求
                    var html = iconv.decode(body, charset || 'gb2312');
                    var $ = cheerio.load(html, {decodeEntities: false});
                    resolve($);
                } else {
                    reject(error);
                }
            });
        });
    }
};

var GetRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};


var download = function (url, dir, filename, cb) {
    if (typeof cb == "function") {
        var stream = fs.createWriteStream(dir + "/" + filename);
        originRequest(url).pipe(stream).on('close', function () {
            cb(null, "下载成功")
        });
    } else {
        return new Promise(function (resolve, reject) {
            var stream = fs.createWriteStream(dir + "/" + filename);
            originRequest(url).pipe(stream).on('close', function () {
                resolve("下载成功");
            });
        });
    }
};

var get = function (url, cb, char) {
    var options = {
        url: url,
        encoding: null,
        headers: headers
    };
    if (typeof cb == "function") {
        http.get(url, function (res) {
            var data = "";
            res.on("data", function (buf) {
                data = data + buf;
            });
            res.on('end', function () {
                cb(null, data);
            });
        }).on('error', function (e) {
            cb("Got error: " + e.message);
        });
    } else {
        return new Promise(function (resolve, reject) {
            originRequest(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {// 发送请求
                    resolve(body);
                } else {
                    reject(error);
                }
            });
            /*http.get(url, function (res) {
                var data = "";
                res.on("data", function (buf) {
                    data = data + buf;
                });
                res.on('end', function () {
                    resolve(data);
                });
            }).on('error', function (e) {
                reject("Got error: " + e.message)
            });*/
        });
    }
};
var get2 = function (url, cb) {
    var options = {
        url: url,
        encoding: null,
        headers: headers
    };
    if (typeof cb == "function") {
        https.get(url, function (res) {
            var data = "";
            res.on("data", function (buf) {
                data = data + buf;
            });
            res.on('end', function () {
                cb(null, data);
            });
        }).on('error', function (e) {
            cb("Got error: " + e.message);
        });
    } else {
        return new Promise(function (resolve, reject) {
            originRequest(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {// 发送请求
                    resolve(body);
                } else {
                    reject(error);
                }
            });
            /*https.get(url, function (res) {
                var data = "";
                res.on("data", function (buf) {
                    data = data + buf;
                });
                res.on('end', function () {
                    resolve(data);
                });
            }).on('error', function (e) {
                reject("Got error: " + e.message)
            });*/
        });
    }
};
var get3 = function (url, cb) {
    var options = {
        url: url,
        encoding: null,
        headers: headers2
    };
    if (typeof cb == "function") {
        https.get(url, function (res) {
            var data = "";
            res.on("data", function (buf) {
                data = data + buf;
            });
            res.on('end', function () {
                cb(null, data);
            });
        }).on('error', function (e) {
            cb("Got error: " + e.message);
        });
    } else {
        return new Promise(function (resolve, reject) {
            originRequest(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {// 发送请求
                    resolve(body);
                } else {
                    reject(error);
                }
            });
            /*https.get(url, function (res) {
                var data = "";
                res.on("data", function (buf) {
                    data = data + buf;
                });
                res.on('end', function () {
                    resolve(data);
                });
            }).on('error', function (e) {
                reject("Got error: " + e.message)
            });*/
        });
    }
};

/*
 * 递归遍历
 * @param data array
 * @param id int
 * return array
 * */
var recursion = function(data, id) {
    var list = [];
    for(var index in data) {
        var v = data[index];
        if(v['parent_id'] == id) {
            v['children'] = recursion(data, v['id']);
            if(v['children'].length == 0) {
                //unset(v['son']);
            }
            list.push(v);
        }
    }
    return list;
}


/*
 * 遍历文件夹，获取所有文件夹里面的文件信息
 * @param path 路径
 *
 */

function geFileList(path)
{
    var filesList = [];
    var targetObj = {};
    readFile(path,filesList,targetObj);
    return filesList;
}

//遍历读取文件
var readFile = function(path,filesList,targetObj)
{
    files = fs.readdirSync(path);//需要用到同步读取
    files.forEach(walk);
    function walk(file)
    {
        states = fs.statSync(path+'/'+file);
        if(states.isDirectory())
        {
            var item ;
            if(targetObj["children"])
            {
                item = {name:file,children:[]};
                targetObj["children"].push(item);
            }
            else
            {
                item = {name:file,children:[]};
                filesList.push(item);
            }

            readFile(path+'/'+file,filesList,item);
        }
        else
        {
            //创建一个对象保存信息
            var obj = new Object();
            obj.size = states.size;//文件大小，以字节为单位
            obj.name = file;//文件名
            obj.path = path+'/'+file; //文件绝对路径

            if(targetObj["children"])
            {
                var item = {name:file,value:obj.path}
                targetObj["children"].push(item);
            }
            else
            {
                var item = {name:file,value:obj.path};
                filesList.push(item);
            }
        }
    }
}
function httpString(s) {
    //var reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
    //var reg = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    //var reg=/(http(s)?\:\/\/)?(www\.)?(\w+\:\d+)?(\/\w+)+\.(swf|gif|jpg|bmp|jpeg)/gi;
    //var reg=/(http(s)?\:\/\/)?(www\.)?(\w+\:\d+)?(\/\w+)+\.(swf|gif|jpg|bmp|jpeg)/gi;
    var reg= /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    //var reg= /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
    //v = v.replace(reg, "<a href='$1$2'>$1$2</a>"); //这里的reg就是上面的正则表达式
    //s = s.replace(reg, "$1$2"); //这里的reg就是上面的正则表达式
    s = s.match(reg);
    return(s)
}

exports.get = get;
exports.get2 = get2;
exports.get3 = get3;
exports.request = request;
exports.GetRandomNum = GetRandomNum;
exports.download = download;
exports.recursion = recursion;
exports.geFileList = geFileList;
exports.httpString = httpString;