// jQuery 专用 Event原型对象
let eventPrototype = {
    preventDefault() {
        this._pD();
    },
    isDefaultPrevented() {
        return this.defaultPrevented;
    },
    stopPropagation() {
        this._sP();
    },
    isPropagationStopped() {
        return this.cancelBubble;
    },
    stopImmediatePropagation() {
        this.isImmediatePropagationStopped = () => TRUE;
        this._sIP();
    },
    isImmediatePropagationStopped: () => FALSE
};

// 初始化Event成jQuery.Event那样
const initEvent = event => {
    if (!event._pD) {
        Object.defineProperties(event, {
            _pD: {
                value: event.preventDefault
            },
            _sP: {
                value: event.stopPropagation
            },
            _sIP: {
                value: event.stopImmediatePropagation
            }
        });
        Object.assign(event, eventPrototype);
    }
    return event;
}

let MOUSEEVENT = MouseEvent;
let TOUCHEVENT = TouchEvent;
// 修正 Event class 用的数据表
let eventsMap = {
    click: MOUSEEVENT,
    mousedown: MOUSEEVENT,
    mouseup: MOUSEEVENT,
    mousemove: MOUSEEVENT,
    mouseenter: MOUSEEVENT,
    mouseleave: MOUSEEVENT,
    touchstart: TOUCHEVENT,
    touchend: TOUCHEVENT,
    touchmove: TOUCHEVENT
};

// 优先执行原生方法的方法名
let realEvents = ['focus', 'blur'];

// 生成Event
let createEvent = $.Event = (type, eventInit) => {
    let TarEvent = eventsMap[type] || Event;
    return initEvent(new TarEvent(type, eventInit));
};

// 获取事件数据
const getEventTypeData = (ele, type) => {
    let data = getEventData(ele);
    return data[type] || (data[type] = []);
};

// 触发事件
const trigger = (eles, type, data, isHandle) => {
    each(eles, ele => {
        if (isElement(ele)) {
            // 优先型的主动触发事件判断
            // 没有数据绑定
            if (!data && realEvents.indexOf(type) > -1 && isFunction(ele[type])) {
                ele[type]();
                return;
            }

            let event;
            if (type instanceof Event) {
                event = type;
            } else {
                // 获取事件对象
                if (!isHandle) {
                    event = createEvent(type, {
                        bubbles: TRUE,
                        cancelable: TRUE
                    });
                } else {
                    event = new Event(type, {
                        bubbles: FALSE,
                        cancelable: TRUE
                    });
                }
            }

            data && defineProperty(event, '_argData', {
                value: data
            });

            // 触发事件
            ele.dispatchEvent(event);
        } else {
            // 自定义数据
            // 获取事件对象
            let eveArr = getEventTypeData(ele, type);

            // 新的事件数组
            let newArr = [];

            let isBreak = 0;
            // 遍历事件数组
            each(eveArr, fData => {
                // 不是一次性的就加入
                if (!fData.isOne) {
                    newArr.push(fData);
                }

                // 是否弹出
                if (isBreak) {
                    return;
                }

                // 生成 event对象
                let event = createEvent(type);

                // 参数修正
                let args = [event];
                if (data) {
                    args.push(data);
                }

                // 判断是否有on上的data
                let onData = fData.data;
                if (!isUndefined(onData)) {
                    event.data = onData;
                }

                // 触发callback
                fData.fn(...args);

                // 删除数据
                delete event.data;

                // 判断是否不用进行下去了
                if (event.isImmediatePropagationStopped()) {
                    isBreak = 1;
                }
            });

            // 重新设置事件对象数据
            let eventBase = getEventData(ele);
            eventBase[type] = newArr;
        }
    });
    return eles;
};

// 事件注册
const on = (eles, events, selector, data, fn, isOne) => {
    // 事件字符串拆分
    events = events.split(' ');

    // 修正变量
    if (isFunction(selector)) {
        fn = selector;
        selector = data = UNDEFINED;
    } else {
        // 判断selector是data还是selector
        if (isString(selector)) {
            // 是selector
            // 判断data是 fn 还是 data
            if (isFunction(data)) {
                fn = data;
                data = UNDEFINED;
            }
        } else {
            fn = data;
            data = selector;
            selector = UNDEFINED;
        }
    }

    // 没有注册函数就别瞎搅和了
    if (!fn) {
        console.error('no function =>', fn);
        return;
    }

    each(eles, ele => {
        each(events, eventName => {
            // 事件函数寄存对象
            let funcData = {
                fn,
                isOne,
                data,
                selector
            };

            // 属于事件元素
            if (isElement(ele)) {
                let eventHandle = function (e) {
                    // 初始化事件对象
                    initEvent(e);

                    // 自定义函数数据
                    !isUndefined(data) && (e.data = data);

                    // 原始数据
                    e.originalEvent = e;

                    let argData = e._argData;
                    if (argData && !isArrayLike(argData)) {
                        argData = [argData];
                    }

                    // 目标
                    let tar = this;

                    // 是否可以运行
                    let canRun = 1;

                    if (selector) {
                        let currentTarget = $(e.target).parents(selector);
                        if (0 in currentTarget) {
                            tar = currentTarget[0];
                        } else if (meetsEle(e.target, selector)) {
                            tar = e.target;
                        } else {
                            canRun = 0;
                        }
                    }

                    if (canRun) {
                        // 执行事件函数
                        if (argData) {
                            fn.call(tar, e, ...argData);
                        } else {
                            fn.call(tar, e);
                        }
                    }

                    // 删除事件实例上的自定义数据
                    delete e.data;
                    delete e.originalEvent;

                    // 判断是否一次性事件
                    if (isOne) {
                        ele.removeEventListener(eventName, eventHandle);
                    }
                }

                // 寄存eventHandle
                funcData.handle = eventHandle;

                ele.addEventListener(eventName, eventHandle);
            }

            // 获取事件数组对象
            let eventArr = getEventTypeData(ele, eventName);

            // 添加入事件数组
            eventArr.push(funcData);
        });
    });

    return eles;
}

const off = (eles, events, selector, fn) => {
    if (events) {
        // 事件字符串拆分
        events = events.split(' ');

        // 判断 是不是selector
        if (!fn && isFunction(selector)) {
            fn = selector;
            selector = UNDEFINED;
        }
    }

    each(eles, ele => {
        // eventBase
        let eventBase = getEventData(ele);

        if (!events) {
            if (isElement(ele)) {
                for (let eventName in eventBase) {
                    let eveArr = eventBase[eventName];
                    each(eveArr, tar => {
                        ele.removeEventListener(eventName, tar.handle);
                    });
                }
            }
            // 注销全部事件
            ele[XQUEEVENTKEY] = {};
            return;
        }

        each(events, eventName => {
            let eveArr = getEventTypeData(ele, eventName);

            if (isElement(ele)) {
                if (fn) {
                    let tar = eveArr.find(function (e) {
                        return e.fn === fn && e.selector === selector;
                    });

                    if (tar) {
                        // 注销事件并移除函数
                        ele.removeEventListener(eventName, tar.handle);
                        removeByArr(eveArr, tar);
                    }
                } else {
                    // 注销所有事件
                    each(eveArr, tar => {
                        ele.removeEventListener(eventName, tar.handle);
                    });
                    // 清空数组
                    eventBase[eventName] = [];
                }
            } else {
                if (fn) {
                    // 移除函数
                    removeByArr(eveArr, fn);
                } else {
                    // 清空数组
                    eventBase[eventName] = [];
                }
            }
        });
    });

    return eles;
}

Object.assign(xQuePrototype, {
    // 注册事件
    on(events, selector, data, fn) {
        // 事件注册
        return on(this, events, selector, data, fn);
    },
    one(events, data, fn) {
        // 事件注册
        return on(this, events, UNDEFINED, data, fn, 1);
    },
    off(events, selector, fn) {
        return off(this, events, selector, fn);
    },
    trigger(type, data) {
        return trigger(this, type, data);
    },
    triggerHandler(type, data) {
        return trigger(this, type, data, 1);
    },
    bind(types, data, fn) {
        return this.on(types, data, fn);
    },
    unbind(types, fn) {
        return this.off(types, fn);
    },
    hover(fnOver, fnOut) {
        return this.on('mouseenter', fnOver).on('mouseleave', fnOut || fnOver);
    }
});

// 一众事件
each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function (eventName) {
    xQuePrototype[eventName] = function (callback) {
        callback ? this.on(eventName, callback) : this.trigger(eventName);
        return this;
    }
});