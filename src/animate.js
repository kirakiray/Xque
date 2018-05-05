assign(xQuePrototype, {
    show() {
        each(this, ele => {
            ele.style.display = "";
        });
        return this;
    },
    hide() {
        each(this, ele => {
            ele.style.display = "none";
        });
        return this;
    }
});