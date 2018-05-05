# ajax api

## 实现

通过 XMLHttpRequest 实现，并非通过 `fetch api` 实现；

因为 fetch api 没有提供到想要的功能，所以才会在做 `$.ajax` 这个功能；

## 基础用法

如下，加入get请求某接口；

```javascript
(async()=>{
    let data = await $.ajax({
        type:"GET",
        url:"http://xxx.com/?data=xxx"
    });
})();
```

跟 `jQuery` 的 ajax api 很像，$.ajax 返回一个 Promise 对象，但是不支持 `success`、`complete`和`error` callback；请使用 Promise 的 `then` `catch` ；

## $.ajax参数

### url

string 接口地址

### type

string 请求类型，一般情况下就 POST 和 GET ，默认是 GET；如 PUT 和 DELETE 也可以使用；

### data

object 传送的数据；一般情况下是对象，Xque会根据 contentType 进行转换；

### contentType

string 默认是 application/json；而 jQuery 的 contentType 默认是 application/x-www-form-urlencoded;

### crossDomain

bool 是否允许跨域，默认是 false；设置为 true的话，请求其他域名会将 cookie 带过去；

### dataType

string 返回的数据类型；默认为空；可以设置为: `json`、`text`、`arraybuffer`或`blob`等；暂不支持 `jsonp`、`script`；

### headers

object 请求头数据；

### timeout

number 超时时间

### username

string 用户名

### password

string 密码

## 其他方法

### loading 和 uploading

下载中的情况状态，如下：

```javascript
let imgFile = await $.ajax({
    url: "https://pages.github.com/images/dashboard@2x.png",
    // dataType: "arraybuffer"
    dataType: "blob"
}).loading(e => {
    let percentage = Math.floor(e.loaded / e.total * 100) + "%";

    // 这个就是百分比 => percentage
    $('#progress').html(percentage);
});
```

用上面的方法，能够获取 `dashboard@2x.png` 这个图片的 `Blob` 数据；并且 `loading` 方法提供加载的进度；

同样，上传图片也能获取进度

```javascript
let stat = await $.ajax({
    url: "https://xxx.com/xxx",
    // 上传图片是 form 类型
    dataType: "form",
    data:{
        img:file
    }
}).uploading(e => {
    let percentage = Math.floor(e.loaded / e.total * 100) + "%";
    $('#progress').html(percentage);
});
```

### beforeSend

发送前触发的 callback，参数为 `XMLHttpRequest` 实例对象；

```javascript
(async()=>{
    let data = await $.ajax({
        type:"GET",
        url:"http://xxx.com/?data=xxx"
    }).beforeSend(oReq =>{
        // xxxx
    });
})();
```

