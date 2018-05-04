// 使用xhr和promise实现的ajax，和jQuery的ajax不一样，它是返回promise实例，但比fetch api多了pending状态监听
let ajaxDefaults = {
    url: "",
    type: "GET",
    data: "",
    crossDomain: FALSE,
    dataType: "",
    headers: {},
    timeout: 100000,
    username: null,
    password: null,
    contentType: "json"
};

const ajax = (options) => {
    let defaults = assign({}, ajaxDefaults);
    assign(defaults, options);

    let {
        contentType
    } = defaults;

    let charsetutf8 = '; charset=UTF-8';
    // 修正contentType
    // application/json; multipart/form-data; application/x-www-form-urlencoded; text/xml;
    if (contentType.indexOf('json') > -1) {
        contentType = "application/json" + charsetutf8;
    } else if (contentType.indexOf('urlencoded') > -1) {
        contentType = "application/x-www-form-urlencoded" + charsetutf8;
    } else if (contentType.indexOf('form') > -1) {
        contentType = "multipart/form-data" + charsetutf8;
    } else if (contentType.indexOf('xml') > -1) {
        contentType = "text/xml" + charsetutf8;
    }

    // 事件寄存对象
    let eveObj = $({});

    // 实例
    var oReq = new XMLHttpRequest();
    // 要返回回去的promise
    let reP = new Promise((res, rej) => {
        // 设置请求
        oReq.open(defaults.type, defaults.url, TRUE, oReq.username, oReq.password);

        // 设置 header
        let {
            headers
        } = defaults;
        for (let k in headers) {
            oReq.setRequestHeader(k, headers[k]);
        }

        // 设置contentType
        oReq.setRequestHeader("Content-Type", contentType);

        // 设置返回数据类型
        oReq.responseType = defaults.dataType;

        // 跨域是否带上cookie
        oReq.withCredentials = defaults.crossDomain;

        // 超时时间设定
        oReq.timeout = defaults.timeout;

        // 设置callback
        oReq.addEventListener('load', e => {
            let {
                target
            } = e;

            let {
                response
            } = e.target;

            // 修正返回数据类型
            let responseContentType = target.getResponseHeader('content-type');
            if (responseContentType && responseContentType.indexOf("application/json") > -1 && typeof response != "object") {
                response = JSON.parse(response);
            }
            res(response);
        }, FALSE);
        oReq.addEventListener('error', e => {
            rej();
        }, FALSE);
        oReq.addEventListener("progress", e => {
            eveObj.trigger('loading', e);
        }, FALSE);
        oReq.upload && oReq.upload.addEventListener("progress", e => {
            eveObj.trigger('uploading', e);
        }, FALSE);
    });

    assign(reP, {
        // 加载中
        loading(func) {
            eveObj.on('loading', (e, data) => func(data));
            return reP;
        },
        // 上传中
        uploading(func) {
            eveObj.on('uploading', (e, data) => func(data));
            return reP;
        },
        // 发送前
        beforeSend(func) {
            // 直接进去函数
            func(oReq);
            return reP;
        }
    });

    // 异步发送请求
    setTimeout(() => {
        let {
            data
        } = defaults;

        if (data) {
            if (contentType.indexOf('urlencoded') > -1) {
                data = objectToUrlencode(data);
            } else if (contentType.indexOf('application/json') > -1) {
                data = JSON.stringify(data);
            }
            oReq.send(data)
        } else {
            oReq.send();
        }
    }, 0);

    return reP;
}

const objectToUrlencode = (obj, headerStr = "") => {
    let str = "";
    for (let k in obj) {
        let val = obj[k];
        if (typeof val === "object") {
            if (headerStr) {
                str += objectToUrlencode(val, `${headerStr}[${k}]`);
            } else {
                str += objectToUrlencode(val, k);
            }
        } else {
            if (headerStr) {
                if (obj instanceof Array) {
                    k = "";
                }
                k = headerStr + `[${k}]`;
            }
            k = encodeURIComponent(k);
            val = encodeURIComponent(val);
            str += `${k}=${val}&`;
        }
    }

    if (!headerStr) {
        // 去掉最后的 &
        str = str.replace(/&$/g, "");
    }
    return str;
}

const ajaxSetup = (options) => {
    assign(ajaxDefaults, options);
}

$.ajax = ajax;
$.ajaxSetup = ajaxSetup;