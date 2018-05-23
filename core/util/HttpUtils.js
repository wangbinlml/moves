var http = require("http");
module.exports.request = (options, postData, cb) => {
    var str = "";
    if (typeof cb == "function") {
        var req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                str = str + chunk;
            });
            res.on('end', () => {
                console.log('No more data in response.');
                cb(null, str)
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            cb(e)
        });

        // write data to request body
        req.write(postData);
        req.end();
    } else {
        return new Promise((resolve, reject) => {
            var req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    str = str + chunk;
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                    resolve(str);
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject(e);
            });

            // write data to request body
            req.write(postData);
            req.end();
        });
    }
};