const http = require('http');
const urltool = require('url');
const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const qs = require('qs');

// promise
const gzip = util.promisify(zlib.gzip);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

//PieServer
var PieServer = function () {
    //web根目录地址
    let rootdir = '/';

    //空目录的引用文件名
    let indexFileName = "index.html";

    // 路径映射
    let tapDatabase = {};

    Object.defineProperties(this, {
        "rootdir": {
            set(val) {
                rootdir = val
            },
            get() {
                return rootdir;
            }
        },
        "indexName": {
            set(val) {
                indexFileName = val;
            },
            get() {
                return indexFileName;
            }
        },
        "tapDatabase": {
            get() {
                return tapDatabase;
            }
        }
    });

    //MIMEMap类型返回
    let mimeMap = this.mimeMap = {
        ".bmp": "image/bmp",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".html": "text/html",
        ".htm": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".appcache": "text/cache-manifest",
        ".json": "application/json"
    }

    //创建服务器
    let server = this.server = http.createServer();

    //监听变动
    server.on('request', async (request, respone) => {
        let {
            url,
            headers
        } = request;

        //返回头
        let responeHeaders = {
            // 服务器类型
            'Server': "PieServer",
            "Access-Control-Allow-Origin": "*",
            // "Access-Control-Allow-Headers": "x-requested-with,content-type"
            //添加max-age（http1.1，一直缓存用；免去使用Etag和lastModify判断，只用版本号控制）
            // 'Cache-Control': "max-age=315360000"
        };

        if (request.method == "OPTIONS") {
            responeHeaders["Access-Control-Allow-Headers"] = "x-requested-with,content-type";
            respone.writeHead(200, responeHeaders);
            respone.end("");
            return;
        }

        //转换成url对象，方便后续操作
        let urlData = urltool.parse(url);

        //获取pathname，并修正文件地址
        let {
            pathname
        } = urlData;

        let tarFunc = tapDatabase[pathname];
        if (tarFunc) {
            let contentType = request.headers['content-type'];
            let requestInfo = {
                urlData,
                responeHeaders
            };

            // 判断是哪种编码
            let isUrlencoded = contentType.indexOf('x-www-form-urlencoded') > -1;
            let isJsonencode = contentType.indexOf('application/json') > -1;
            let isFormData = contentType.indexOf('multipart/form-data') > -1;
            let isTextXml = contentType.indexOf('text/xml') > -1;

            // 判断请求类型
            if (isUrlencoded || isJsonencode) {
                // 获取响应回来的数据
                let responeData = await new Promise(res => {
                    let data = "";
                    request.on('data', (chunk) => {
                        data += chunk;
                    });
                    request.on('end', (chunk) => {
                        res(data);
                    });
                });

                // 根据类型进行转换
                if (isJsonencode) {
                    responeData = JSON.parse(responeData);
                } else if (isUrlencoded) {
                    responeData = qs.parse(responeData);
                }


                requestInfo.data = responeData;
            }

            let responseText = await tarFunc(request, requestInfo);

            if (typeof responseText === "object") {
                responseText = JSON.stringify(responseText);
                responeHeaders['Content-Type'] = 'application/json';
            }

            //判断非图片
            //判断能接受gzip类型
            let acceptCode = headers['accept-encoding'];
            if (acceptCode && acceptCode.search('gzip') > -1) {
                //转换gzip
                responseText = await gzip(responseText);

                //添加gz压缩头信息
                responeHeaders['Content-Encoding'] = 'gzip';
            }

            //设置文件大小
            responeHeaders['Content-Length'] = responseText.length;

            //存在文件，就返回数据
            respone.writeHead(200, responeHeaders);
            respone.end(responseText);
            return;
        }

        if (/\/$/.test(pathname)) {
            pathname += indexFileName;
        }
        pathname = rootdir + pathname;

        //获取后缀并设置返回类型
        let suffix = /(.+)(\..+)$/g.exec(pathname.toLowerCase());
        suffix = suffix && suffix[2];

        //mime类型
        let mime;
        if (suffix) {
            mime = mimeMap[suffix];
        }

        if (mime) {
            responeHeaders['Content-Type'] = mime;

            //图片的话断流返回数据
            let imgstat;

            try {
                imgstat = await stat(pathname);
            } catch (e) {}

            //存在图片才返回
            if (imgstat) {
                //设置文件大小
                responeHeaders['Content-Length'] = imgstat.size;

                //写入头数据
                respone.writeHead(200, responeHeaders);
                fs.createReadStream(pathname).pipe(respone);
            } else {
                //不存在就返回错误
                respone.writeHead(404);
                respone.end("error : no data");
            }
        } else {
            //不存在就返回错误
            respone.writeHead(404);
            respone.end("error : no data");
        }

        console.log(pathname, request);
    });
};

PieServer.prototype = {
    //监听端口
    listen(port) {
        this.server.listen(port);
    },
    //事件监听
    on(...args) {
        this.server.on.apply(this.server, args);
    },
    // tap路径监听
    tap(url, callback) {
        this.tapDatabase[url] = callback;
    }
};

Object.defineProperties(PieServer.prototype, {
    //获取监听接口
    "port": {
        get: function () {
            return this.server.address().port;
        }
    }
});

module.exports = PieServer;