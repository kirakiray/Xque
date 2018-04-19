const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

let count = 1;

let mainFun = async () => {
    // 打开主体base文件
    let basefile = await readFile('src/xque.js', 'utf8');

    // 扩展节点操控
    let domControlText = await readFile('src/domControl.js', 'utf8');

    // 整合 扩展控制器逻辑 
    basefile = basefile.replace('//<!--domControl-->', domControlText);

    // 盒模型
    let boxModuleText = await readFile('src/boxModule.js', 'utf8');

    // 整合 扩展控制器逻辑 
    basefile = basefile.replace('//<!--boxModule-->', boxModuleText);

    // 写入最终文件
    fs.writeFile('dist/xque.js', basefile, 'utf8', (err) => {
        if (err) throw err;
        console.log('shear.js write succeed!' + count++);
    });
}

let readFileTimer;

fs.watch('src/', async (err, file) => {
    clearTimeout(readFileTimer);
    readFileTimer = setTimeout(mainFun, 1000);
});