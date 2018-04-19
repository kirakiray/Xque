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