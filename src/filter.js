const filterBase = (tars, val, meetcall, notmeetcall) => {
    let arr = [];
    if (isString(val)) {
        each(tars, ele => {
            if (meetsEle(ele, val)) {
                meetcall && meetcall(arr, ele);
            } else {
                notmeetcall && notmeetcall(arr, ele);
            }
        });
    } else if (isArrayLike(val)) {
        each(tars, ele => {
            each(val, val => {
                if (ele === val) {
                    meetcall && meetcall(arr, ele);
                } else {
                    notmeetcall && notmeetcall(arr, ele);
                }
            });
        });
    } else if (isElement(val)) {
        each(tars, ele => {
            if (val === ele) {
                meetcall && meetcall(arr, ele);
            } else {
                notmeetcall && notmeetcall(arr, ele);
            }
        });
    } else if (isFunction(val)) {
        each(tars, (ele, i) => {
            if (val.call(ele, i, ele)) {
                meetcall && meetcall(arr, ele);
            } else {
                notmeetcall && notmeetcall(arr, ele);
            }
        });
    }
    return $(arr);
}

const propKey = (expr, key, tars) => {
    let arr = [];
    each(tars, tar => {
        tar = tar[key];
        if (!tar || arr.indexOf(tar) != -1 || (expr && !meetsEle(tar, expr))) {
            return;
        }
        arr.push(tar);
    });
    return $(arr);
}

const nuExpr = (tars, key, filter, lastExpr) => {
    let arr = [];
    let getEle = tar => {
        let nextEle = tar[key];
        if (nextEle) {
            if (lastExpr) {
                if ((getType(lastExpr) === STR_string && meetsEle(nextEle, lastExpr)) || lastExpr === nextEle || (lastExpr instanceof Array && lastExpr.indexOf(nextEle) > -1)) {
                    return;
                }
            }
            if ((!filter || meetsEle(nextEle, filter)) && arr.indexOf(nextEle) === -1) {
                arr.push(nextEle);
            }
            getEle(nextEle);
        }
    };
    each(tars, tar => {
        getEle(tar);
    });
    getEle = null;
    return $(arr);
};

assign(xQuePrototype, {
    slice(...args) {
        let newArr = [].slice.call(this, ...args);
        return $(newArr);
    },
    eq(index) {
        return this.slice(index, parseInt(index) + 1 || undefined);
    },
    first() {
        return this.eq(0);
    },
    last() {
        return this.eq(-1);
    },
    get(index) {
        if (isUndefined(index)) {
            return makeArray(this);
        } else {
            return this[index];
        }
    },
    hasClass(val) {
        // 默认没有
        let hasClass = !1;
        each(this, e => {
            e.classList.contains(val) && (hasClass = !0);
        });
        return hasClass;
    },
    // 筛选器
    filter(val) {
        return filterBase(this, val, (arr, ele) => arr.push(ele));
    },
    // 否定版的筛选器
    not(val) {
        return filterBase(this, val, 0, (arr, ele) => arr.push(ele));
    },
    // 是否存在表达式内的元素
    is(val) {
        return 0 in this.filter(val);
    },
    map(callback) {
        let arr = [];
        each(this, (e, i) => {
            arr.push(callback(i, e));
        });
        return $(arr);
    },
    find(expr) {
        return $(expr, this);
    },
    has(expr) {
        let arr = [];
        each(this, e => {
            (0 in $(expr, e)) && (arr.push(e));
        });
        return $(arr);
    },
    children(expr) {
        let eles = [];
        each(this, e => {
            e.nodeType && each(makeArray(e.children), e => {
                if (expr) {
                    meetsEle(e, expr) && eles.push(e);
                } else {
                    eles.push(e);
                }
            });
        });
        return $(eles);
    },
    next(expr) {
        return propKey(expr, "nextElementSibling", this);
    },
    prev(expr) {
        return propKey(expr, "previousElementSibling", this);
    },
    parent(expr) {
        return propKey(expr, "parentNode", this);
    },
    nextAll(filter) {
        return nuExpr(this, 'nextElementSibling', filter);
    },
    prevAll(filter) {
        return nuExpr(this, 'previousElementSibling', filter);
    },
    parents(filter) {
        return nuExpr(this, 'parentNode', filter, DOCUMENT);
    },
    nextUntil(lastExpr, filter) {
        return nuExpr(this, 'nextElementSibling', filter, lastExpr);
    },
    prevUntil(lastExpr, filter) {
        return nuExpr(this, 'previousElementSibling', filter, lastExpr);
    },
    parentsUntil(lastExpr, filter) {
        return nuExpr(this, 'parentNode', filter, lastExpr);
    },
    closest(selector) {
        var parentEles = $(selector).parent();
        return this.parentsUntil(parentEles, selector);
    },
    siblings(expr) {
        let _this = this;
        return this.parent().children(expr).filter(function () {
            if (_this.indexOf(this) === -1) return true;
        });
    },
    offsetParent() {
        let arr = [];
        each(this, e => {
            arr.push(e.offsetParent || DOCUMENT.body);
        });
        return $(arr);
    }
});