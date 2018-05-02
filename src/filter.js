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
    } else if (val instanceof Element) {
        each(tars, ele => {
            if (val === ele) {
                meetcall && meetcall(arr, ele);
            } else {
                notmeetcall && notmeetcall(arr, ele);
            }
        });
    } else if (isFunction(val)) {
        each(tars, (ele, i) => {
            if (val(i, ele)) {
                meetcall && meetcall(arr, ele);
            } else {
                notmeetcall && notmeetcall(arr, ele);
            }
        });
    }
    return $(arr);
}

Object.assign(xQuePrototype, {
    eq(index) {
        return $(this[index]);
    },
    get(index) {
        if (isUndefined(index)) {
            return makeArray(this);
        } else {
            return this[index];
        }
    },
    first() {
        return $(this[0]);
    },
    last() {
        return $(this.length - 1);
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
    slice(...args) {
        let newArr = [].slice.call(this, ...args);
        return $(newArr);
    },
    find(expr) {
        return $(expr, this);
    }
});