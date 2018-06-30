var http = require("http");
var https = require("https");
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

module.exports.get = (url, cb) => {
    var str = "";
    if (typeof cb == "function") {
        http.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
                cb(error);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
                cb(error);
            }
            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                cb(error);
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    console.log(rawData);
                    cb(null, rawData);
                } catch (e) {
                    console.error(e.message);
                    cb(e);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            cb(e);
        });
    } else {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                const { statusCode } = res;
                const contentType = res.headers['content-type'];

                let error;
                if (statusCode !== 200) {
                    error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
                    reject(error);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
                    reject(error);
                }
                if (error) {
                    console.error(error.message);
                    // consume response data to free up memory
                    res.resume();
                    reject(error);
                    return;
                }

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        console.log(rawData);
                        resolve(rawData);
                    } catch (e) {
                        console.error(e.message);
                        reject(e);
                    }
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
                reject(e);
            });
        });
    }
};
module.exports.get2 = (url, cb) => {
    var str = "";
    if (typeof cb == "function") {
        https.get(url, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            res.on('data', (rawData) => {
                console.log(rawData.toString());
                cb(null, rawData.toString());
            });

        }).on('error', (e) => {
            console.error(e);
            cb(e);
        });
    } else {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                res.on('data', (rawData) => {
                    resolve(rawData.toString());
                });

            }).on('error', (e) => {
                console.error(e);
                reject(e);
            });
        });
    }
};