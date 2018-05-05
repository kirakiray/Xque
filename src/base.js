((glo) => {
    "use strict";

    // 全局存在 jQuery 的情况下，就不瞎折腾了
    if (glo.$) {
        return;
    }

    // COMMON
    const DOCUMENT = document;
    const STR_string = "string";
    const STR_array = "array";

    const FALSE = !1;
    const TRUE = !0;
    const UNDEFINED = undefined;

    // function
    // 获取类型
    let objToString = Object.prototype.toString;
    const getType = value => objToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    // 是否函数(包括异步函数)
    const isFunction = v => getType(v).search('function') > -1;

    const isString = v => getType(v) === "string";

    // 是否 undefined
    const isUndefined = v => v === undefined;

    // 是否像数组（包括数组）
    const isArrayLike = obj => !isUndefined(obj) && getType(obj.length) === "number" && obj.length >= 0 && !isFunction(obj) && !isString(obj);

    const isElement = obj => obj instanceof Element;

    const {
        defineProperty,
        assign
    } = Object;

    // 生成数组
    const makeArray = arr => Array.from(arr);

    // 获得随机id
    const getRandomId = () => Math.random().toString(32).substr(2);

    // 合并数组
    const merge = (mainArr, arr2) => mainArr.splice(mainArr.length, 0, ...arr2);

    // 删除数组内的某项
    const removeByArr = (arr, tar) => {
        let id = arr.indexOf(tar);
        if (id > -1) {
            arr.splice(id, 1);
        }
    }

    // 遍历
    const each = (arr, func) => arr.some((e, i) => func(e, i) === FALSE);

    // 获取样式
    const getStyle = getComputedStyle;

    // 拆分空格参数
    const splitSpace = (value, func) => {
        let vArr = value.split(' ');
        each(vArr, e => func(e));
    }

    // 关键key
    const XQUEKEY = "XQUE_" + getRandomId();
    const XQUEEVENTKEY = XQUEKEY + "_event";

    // 单个参数的拆分固定式
    // getFunc 非必须
    // isReturnGetFunc 是否返回 getFunc 函数
    const singleIn = (targets, value, func, getFunc, isReturnGetFunc) => {
        // 获取值的类型
        let v_isFunc = isFunction(value);

        if (!isUndefined(value)) {
            // 遍历对象
            each(targets, (e, i) => {
                // 获取值
                let before_val;
                if (v_isFunc) {
                    before_val = value.call(e, i, getFunc && getFunc(e));
                } else {
                    before_val = value;
                }
                if (!isUndefined(before_val)) {
                    func(e, before_val, i);
                }
            });
        } else {
            // 属于获取值
            if (isReturnGetFunc) {
                return getFunc(targets[0]);
            }
        }

        return targets;
    }

    // 两个参数的拆分固定式
    const pairIn = (targets, args, setCall, getCall) => {
        // 获取两个参数
        let [arg1, arg2] = args;

        // 获取第一个参数的类型
        let a1Type = getType(arg1);

        if (a1Type == "object") {
            // 对象类型，遍历代入
            for (let i in arg1) {
                each(targets, e => {
                    setCall(e, i, arg1[i]);
                });
            }
        } else if (isFunction(arg2)) {
            // 如果参数2是函数
            each(targets, (e, i) => {
                arg2.call(e, i, getCall(e, arg1));
            });
        } else if (!arg2) {
            // 不存在第二个参数，属于返回值
            return getCall(targets[0], arg1);
        } else {
            //普通类型，直接代入
            each(targets, e => {
                setCall(e, ...args);
            });
        }

        // 返回targets
        return targets;
    }

    // 修正数字类型变成像素字符串
    const fixNumber = value => (getType(value) == "number") ? (value + "px") : value;

    // main function
    // 查找元素
    const findElement = (selector, context = DOCUMENT) => makeArray(context.querySelectorAll(selector));

    // 转换元素
    const parseDom = (str) => {
        let par = DOCUMENT.createElement('div');
        par.innerHTML = str;
        let childs = makeArray(par.childNodes);
        return childs.filter(function (e) {
            let isInText = e instanceof Text;
            if (!isInText || (e.textContent && e.textContent.trim())) {
                return e;
            }
        });
    };

    // 判断元素是否符合条件
    const meetsEle = (ele, expr) => {
        if (ele === expr) {
            return !0;
        }
        let fadeParent = DOCUMENT.createElement('div');
        if (ele === DOCUMENT) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in findElement(expr, fadeParent) ? true : false;
    }

    // 获取元素的数据
    const getData = ele => ele[XQUEKEY] || (ele[XQUEKEY] = {});

    // 获取事件数据对象
    const getEventData = ele => ele[XQUEEVENTKEY] || (ele[XQUEEVENTKEY] = {});

    // main
    // 主体class
    // 只接受数组
    function XQue(elems = []) {
        merge(this, elems);
    }

    // 从属数组类型
    let xQuePrototype = Object.create(Array.prototype);

    // 合并方法
    assign(xQuePrototype, {
        // addClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.add(value);
        //         });
        //     }, target => target.classList.value);
        // },
        // removeClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.remove(value);
        //         });
        //     }, target => target.classList.value);
        // },
        // toggleClass(val) {
        //     return singleIn(this, val, (target, value) => {
        //         splitSpace(value, value => {
        //             target.classList.toggle(value);
        //         });
        //     }, target => target.classList.value);
        // },
        attr(...args) {
            return pairIn(this, args, (target, key, value) => {
                target.setAttribute(key, value);
            }, (target, key) => target.getAttribute(key));
        },
        removeAttr(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    target.removeAttribute(value);
                });
            });
        },
        prop(...args) {
            return pairIn(this, args, (target, key, value) => {
                target[key] = value;
            }, (target, key) => target[key]);
        },
        removeProp(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    delete target[value];
                });
            });
        },
        data(...args) {
            return pairIn(this, args, (target, key, value) => {
                getData(target)[key] = value;
            }, (target, key) => {
                let data = {};
                assign(data, target.dataset);
                assign(data, getData(target));
                return data[key];
            });
        },
        removeData(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    delete getData(target)[value];
                });
            });
        },
        css(...args) {
            return pairIn(this, args, (target, key, value) => {
                value = fixNumber(value);
                target.style[key] = value;
            }, (target, key) => getStyle(target)[key]);
        },
        text(val) {
            return singleIn(this, val, (target, value) => {
                target.textContent = value;
            }, target => target.textContent, 1);
        },
        html(val) {
            return singleIn(this, val, (target, value) => {
                target.innerHTML = value;
            }, target => target.innerHTML, 1);
        },
        val(val) {
            return singleIn(this, val, (target, value) => {
                target.value = value;
            }, target => target.vaule, 1);
        },
        each(callback) {
            each(this, (e, i) => {
                callback(i, e);
            });
            return this;
        },
        index(ele) {
            let owner, tar;
            if (!ele) {
                tar = this[0];
                owner = makeArray(tar.parentNode.children);
            } else if (ele.nodeType) {
                tar = ele;
                owner = this;
            } else if (ele instanceof $) {
                tar = ele[0];
                owner = this;
            } else if (getType(ele) === STR_string) {
                tar = this[0];
                owner = $(ele);
            }
            return owner.indexOf(tar);
        },
        extend(obj) {
            assign(xQuePrototype, obj);
        }
    });

    // class操作
    let classControlObj = {
        addClass(target, value) {
            target.classList.add(value);
        },
        removeClass(target, value) {
            target.classList.remove(value);
        },
        toggleClass(target, value) {
            target.classList.toggle(value);
        }
    };

    for (let funcName in classControlObj) {
        // 获取函数
        let func = classControlObj[funcName];

        // 初始化操作
        xQuePrototype[funcName] = function (val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    func(target, value);
                });
            }, target => target.classList.value);
        };
    }

    const eachContext = (context, callback) => {
        if (isArrayLike(context)) {
            each(makeArray(context), ele => {
                callback(ele);
            });
        } else {
            callback(context);
        }
    }

    // 外部方法
    let $ = function (selector, context) {
        // 获取type
        let type = getType(selector);

        // 元素
        let elems = [];

        // 针对不同类型做处理
        switch (type) {
            case STR_string:
                if (selector.search('<') > -1) {
                    elems = parseDom(selector);
                } else {
                    eachContext(context, ele => {
                        let eles = findElement(selector, ele);
                        merge(elems, eles);
                    });
                }
                break;
            case STR_array:
                elems = selector;
                break;
            default:
                if (isArrayLike(selector)) {
                    // 类数组
                    elems = makeArray(selector);
                } else if (isFunction(selector)) {
                    // 属于函数
                    if (DOCUMENT.readyState === "complete") {
                        selector($)
                    } else {
                        DOCUMENT.addEventListener('DOMContentLoaded', function () {
                            selector($)
                        }, false);
                    }
                    elems = [DOCUMENT];
                } else if (selector) {
                    if (context && isElement(selector)) {
                        eachContext(context, ele => {
                            let selectorTagName = selector.tagName.toLowerCase();
                            let findEles = findElement(selectorTagName, ele);
                            each(findEles, e => {
                                (selector === e) && (elems.push(e));
                            });
                        });
                    } else {
                        // 其他类型
                        elems = [selector];
                    }
                }
        }

        return new XQue(elems);
    }

    //<!--dom-->

    //<!--box-->

    //<!--filter-->

    //<!--event-->

    //<!--ajax-->

    //<!--animate-->

    // 修正原型链
    $.prototype = $.fn = XQue.prototype = xQuePrototype;

    $.extend = (...args) => {
        if (args.length === 1) {
            let obj = args[0];
            if (getType(obj) == "object") {
                assign($, obj);
            }
        } else {
            assign(...args);
        }
    };

    // 暴露到外部
    glo.$ = $;
})(window);