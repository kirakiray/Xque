const PieServer = require('./pieServer');

// 服务器实例
let server = new PieServer();

// 设置根目录
server.rootdir = __dirname.replace(/\/scripts$/, "");

server.tap('/api', (request, rInfo) => new Promise((res, rej) => {
    switch (request.method) {
        case "POST":
            // let data = "";

            // request.on('data', (chunk) => {
            //     data += chunk;
            // });
            // request.on('end', (chunk) => {
            //     data;
            //     urlObj;
            //     res(data);
            // });
            res(rInfo.data);
            break;
    }
}));

// 监听端口
server.listen(8998);