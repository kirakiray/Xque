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

    // function
    // 获取类型
    let objToString = Object.prototype.toString;
    const getType = value => objToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    // 是否函数(包括异步函数)
    const isFunction = v => getType(v).search('function') > -1;

    // 是否 undefined
    const isUndefined = v => v === undefined;

    // 生成数组
    const makeArray = arr => Array.from(arr);

    // 合并数组
    const merge = (mainArr, arr2) => mainArr.splice(mainArr.length, 0, ...arr2);

    // 遍历
    const each = (arr, func) => arr.forEach(func);

    // 获取样式
    const getStyle = getComputedStyle;

    // 拆分空格参数
    const splitSpace = (value, func) => {
        let vArr = value.split(' ');
        each(vArr, e => func(e));
    }

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

    // main
    // 主体class
    // 只接受数组
    function XQue(elems = []) {
        merge(this, elems);
    }

    // 从属数组类型
    var xQuePrototype = Object.create(Array.prototype);

    // 合并方法
    Object.assign(xQuePrototype, {
        addClass(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    target.classList.add(value);
                });
            }, target => target.classList.value);
        },
        removeClass(val) {
            return singleIn(this, val, (target, value) => {
                splitSpace(value, value => {
                    target.classList.remove(value);
                });
            }, target => target.classList.value);
        },
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
        css(...args) {
            return pairIn(this, args, (target, key, value) => {
                value = fixNumber(value);
                target.style[key] = value;
            }, (target, key) => getStyle(target)[key]);
        },
        get(index) {
            if (isUndefined(index)) {
                return makeArray(this);
            } else {
                return this[index];
            }
        }
    });

    // 修正为元素
const fixToEle = (tars, val, func) => {
    // 获取需要添加目标元素的长度
    let tarLen = tars.length;

    return singleIn(tars, val, (target, value) => {
        // 获取 value 类型
        let valueType = getType(value);

        // 减去长度计量器
        tarLen--;

        // 最后要添加进去的类型
        let eles = value;

        // 根据不同数据类型进行转换
        if (valueType === "string") {
            // 转换字符串类型
            eles = parseDom(value);
        } else if (value instanceof Element) {
            // 判断是否元素，是的话进行克隆
            eles = [value];
        }

        // 修正元素数组
        if (tarLen > 0) {
            eles = eles.map(e => e.cloneNode(true));
        }

        // 全部添加进去
        each(eles, ele => {
            func(target, ele);
        });
    }, target => target.innerHTML);
}

// 节点操控方法
Object.assign(xQuePrototype, {
    append(val) {
        return fixToEle(this, val, (target, ele) => {
            target.appendChild(ele);
        });
    }
});

    // 盒模型相关方法
// width height innerWidth innerHeight outerWidth outerHeight
// 获取样式像素值
const getStylePx = (target, styleName) => parseFloat(getStyle(target)[styleName]);

each([{
    'Width': ['left', 'right']
}, {
    'Height': ['top', 'bottom']
}], obj => {
    for (let fName in obj) {
        // 小写名
        let lowCaseFName = fName.toLowerCase();

        // 设置小写值方法
        xQuePrototype[lowCaseFName] = function (value) {
            return singleIn(this, value, (target, value) => {
                value = fixNumber(value);
                target.style[lowCaseFName] = value;
            }, target => getStylePx(target, lowCaseFName), 1);
        }

        // 获取目标关键词
        let keyArr = obj[fName];

        // 带关卡性的获取值
        // 原始值必带，首个参数是target，往后顺序是是否需要 padding border margin
        let getFunc = (target, hasPadding, hasBorder, hasMargin) => {
            // 原始值
            let oriVal = getStylePx(target, lowCaseFName);

            each(keyArr, k => {
                // padding
                hasPadding && (oriVal += getStylePx(target, 'padding-' + k));

                // border
                hasBorder && (oriVal += getStylePx(target, 'border-' + k + "-width"));

                // margin
                hasMargin && (oriVal += getStylePx(target, 'margin-' + k));
            });

            return oriVal;
        }

        // 获取inner值方法
        let innerFunc = xQuePrototype['inner' + fName] = function () {
            return getFunc(this[0], 1);
        }

        xQuePrototype['outer' + fName] = function (bool) {
            return getFunc(this[0], 1, 1, bool);
        }
    }
});

Object.assign(xQuePrototype, {
    // 已取消使用offset设定定位的方法，请用好的css布局来调整定位
    offset() {
        // 获取目标
        let tar = this[0];
        let top = 0,
            left = 0;
        do {
            top += tar.offsetTop;
            left += tar.offsetLeft;
            tar = tar.offsetParent;
        } while (tar)

        return {
            top,
            left
        };
    },
    position() {
        let tar = this[0];
        return {
            top: tar.offsetTop,
            left: tar.offsetLeft
        };
    },
    scrollTop(val) {
        return singleIn(this, val, (target, value) => {
            target.scrollTop = value;
        }, target => target.scrollTop, 1);
    },
    scrollLeft(val) {
        return singleIn(this, val, (target, value) => {
            target.scrollLeft = value;
        }, target => target.scrollLeft, 1);
    }
});

    // 外部方法
    let $ = function (selector, context) {
        // 获取type
        let type = getType(selector);

        // 元素
        let elems;

        // 针对不同类型做处理
        switch (type) {
            case STR_string:
                elems = findElement(selector, context);
                break;
            case STR_array:
                elems = selector;
                break;
            default:
                let len = selector.length;
                if (typeof len === "number" && len >= 0) {
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
                } else if (selector) {
                    // 其他类型
                    elems = [selector];
                }
        }

        return new XQue(elems);
    }

    // 修正原型链
    $.prototype = $.fn = XQue.prototype = XQue.fn = xQuePrototype;

    // 暴露到外部
    glo.$ = $;
})(window);