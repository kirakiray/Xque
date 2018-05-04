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
        if (valueType === STR_string) {
            // 转换字符串类型
            eles = parseDom(value);
        } else if (isElement(value)) {
            // 判断是否元素，是的话进行克隆
            eles = [value];
        }

        // 修正元素数组
        if (tarLen > 0) {
            eles = [].map.call(eles, e => e.cloneNode(true));
        }

        // 全部添加进去
        each(eles, ele => {
            func(target, ele);
        });
    }, target => target.innerHTML);
}

// 映射$实例数据
const mapClone = (cloneEle, ele) => {
    // 自定义数据
    cloneEle[XQUEKEY] = assign({}, getData(ele));

    // 自定义事件
    let eveData = getEventData(ele);
    let cloneEveData = getEventData(cloneEle);

    for (let eventName in eveData) {
        let eves = eveData[eventName];
        let cloneEves = cloneEveData[eventName] = [];

        each(eves, eData => {
            let cloneEData = assign({}, eData);
            cloneEves.push(cloneEData);
            cloneEle.addEventListener(eventName, cloneEData.handle);
        });
    }
}

// 映射子元素
const mapCloneToChilds = (cloneEle, ele) => {
    let cloneChilds = Array.from(cloneEle.children);
    let childs = ele.children;

    each(cloneChilds, (cloneEle, i) => {
        let ele = childs[i];
        mapClone(cloneEle, ele);

        // 递归
        mapCloneToChilds(cloneEle, ele);
    });

}

// 节点操控方法
Object.assign(xQuePrototype, {
    append(val) {
        return fixToEle(this, val, (target, ele) => {
            target.appendChild(ele);
        });
    },
    prepend(val) {
        return fixToEle(this, val, (target, ele) => {
            target.insertBefore(ele, target.firstChild);
        });
    },
    before(val) {
        return fixToEle(this, val, (target, ele) => {
            target.parentNode.insertBefore(ele, target);
        });
    },
    after(val) {
        return fixToEle(this, val, (target, ele) => {
            var parnode = target.parentNode;
            if (parnode.lastChild === target) {
                parnode.appendChild(ele);
            } else {
                parnode.insertBefore(ele, target.nextSibling);
            }
        });
    },
    wrap(val) {
        return fixToEle(this, val, (target, ele) => {
            target.parentNode.insertBefore(ele, target);
            ele.appendChild(target);
        });
    },
    unwrap() {
        var arr = [];
        each(this, function (e) {
            var par = e.parentNode;
            par.parentNode.insertBefore(e, par);
            if (arr.indexOf(par) === -1) {
                arr.push(par);
            }
        });
        $(arr).remove();
        return this;
    },
    wrapInner(val) {
        return fixToEle(this, val, (target, ele) => {
            each(makeArray(target.childNodes), function (e2) {
                ele.appendChild(e2);
            });
            target.appendChild(ele);
        });
    },
    wrapAll(val) {
        if (isString(val)) {
            val = parseDom(val);
        }
        let tar = this.eq(0);
        tar.before(val = $(val));
        each(this, e => val.append(e));
        return this;
    },
    replaceWith(val) {
        return this.before(val).remove();
    },
    empty() {
        each(this, e => {
            e.innerHTML = "";
        });
    },
    remove(expr) {
        each(this, e => {
            if (expr) {
                if (!meetsEle(e, expr)) return;
            }
            e.parentNode.removeChild(e);
        });
    },
    clone(withData, deepData) {
        return this.map((i, ele) => {
            let cloneEle = ele.cloneNode(TRUE);

            // 深复制当前元素
            if (withData) {
                mapClone(cloneEle, ele);
            }

            // 深复制子元素
            if (deepData) {
                mapCloneToChilds(cloneEle, ele);
            }
            return cloneEle;
        });
    }
});

let dom_in_turn_Obj = {
    append: "appendTo",
    prepend: "prependTo",
    after: "insertAfter",
    before: "insertBefore",
    replaceWith: "replaceAll"
};

for (let k in dom_in_turn_Obj) {
    // 获取要定义的函数名
    let funcName = dom_in_turn_Obj[k];

    // 参数调转
    xQuePrototype[funcName] = function (content) {
        $(content)[k](this);
    }
}