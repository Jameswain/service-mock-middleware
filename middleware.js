const Table = require('cli-table3');
const path = require('path');
const fs = require('fs');
const fe = require('fs-extra');
const url = require('url');
const { URL } = url;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const logUpdate = require("log-update");
const chalk = require('chalk');
const semver = require('semver')
const packageConfig = require('./package.json')
const currentVersion = semver.clean(process.version);

// TODO 需要做低版本升级提示
if (!semver.satisfies(currentVersion, packageConfig.engines.node)) {
    // node版本低于package.json配置的版本，提示用户升级node
    console.log(chalk.red('😂 对不起，您的node版本过低，请升级您的node!'));
    console.log(`您的版本：${chalk.red(currentVersion)}`);
    console.log(`要求版本：${chalk.green(packageConfig.engines.node)}`);
}

/**
 * 设置index.html和mock文件映射关系
 * @param p - htmlWebpackPlugin对象
 * @param options - 中间件配置选项
 */
function setMapMock(p, options, watchTarget) {
    if (!fe.existsSync(watchTarget)) return;
    const stat = fs.statSync(watchTarget);
    options.mapMock[p.options.filename] = options.mapMock[p.options.filename] || [];
    if (stat.isFile()) {
        options.mapMock[p.options.filename].push(watchTarget);
    } else {
        options.mapMock[p.options.filename] = options.mapMock[p.options.filename].concat(fs.readdirSync(watchTarget).map(file => path.join(watchTarget, file)));
    }
}

/**
 * 将webpack.entry位置和mock配置文件进行映射
 */
function webpackEntryToMapMock(options) {
    if (!options.webpackConfig) throw new Error('请传入webpack配置');
    const filename = options.filename.indexOf('/') === 0 ? options.filename.substr(1) : options.filename;
    const arrHtmlPlugins = options.webpackConfig.plugins.filter(item => item instanceof HtmlWebpackPlugin);
    // 字符串类型entry
    if (typeof options.webpackConfig.entry === 'string') {
        const watchTarget = path.join(path.parse(path.resolve(options.webpackConfig.entry)).dir, filename);
        arrHtmlPlugins.forEach(p => setMapMock(p, options, watchTarget));
    }
    // 数组类型entry
    else if (Array.isArray(options.webpackConfig.entry)) {
        arrHtmlPlugins.forEach(p => {
            options.webpackConfig.entry.forEach(entry => {
                const watchTarget = path.join(path.parse(path.resolve(entry)).dir, filename)
                setMapMock(p, options, watchTarget);
            });
        });
    }
    // 对象类型entry
    else if (Object.prototype.toString.call(options.webpackConfig.entry) === '[object Object]') {
        for (let key in options.webpackConfig.entry) {
            let arrJs = options.webpackConfig.entry[key];
            arrJs = arrJs instanceof Array ? arrJs : [arrJs];
            arrJs = arrJs.filter(js => js.indexOf('node_modules') === -1);
            if (!arrJs || !arrJs.length) continue;
            for (let i = 0; i < arrJs.length; i++) {
                const watchTarget = path.resolve(path.join(path.parse(arrJs[i]).dir, options.filename));
                arrHtmlPlugins.forEach(p => {
                    if (!p.options.chunks.includes(key)) return;
                    setMapMock(p, options, watchTarget);
                });
            }
        }
    } else if (Object.prototype.toString.call(options.webpackConfig.entry) === '[object Promise]') {
        // TODO 即将支持
    } else if (typeof options.webpackConfig.entry === 'function') {
        // TODO 即将支持
    }
}

/**
 * 监听mock配置文件
 */
function watchMockFile(options) {
    // 监听回调函数
    const watchCallback = () => {
        // 让浏览器刷新
        if (options.server) {
            options.server.sockWrite(options.server.sockets, 'content-changed');
        } else {
            console.log(chalk.red('对不起，您没有传入webpack-dev-server对象，无法使用浏览器自动刷新功能！'));
        }
    }
    [...new Set(Object.values(options.mapMock).reduce((previousValue, currentValue) => ([...previousValue, ...currentValue]), []))].forEach(watchTarget => {
        // 无视.js和.node以外的任何文件
        if (!['.js', '.node'].includes(path.parse(watchTarget).ext)) return;
        const stat = fs.statSync(watchTarget);
        if (stat.isFile()) {
            fs.watchFile(watchTarget, watchCallback);
        } else if (stat.isDirectory()) {
            fs.watch(watchTarget, watchCallback);
        }
    });
}

/**
 * 初始化mock中间件
 * @param options 中间件配置
 */
function initialize(options) {
    options.publicPath = options.publicPath || '';
    // 默认要监听的文件或路径
    options.filename = options.filename || '/mock';
    // mock文件与html文件的映射
    options.mapMock = {};
    // 获取所有的HtmlWebpackPlugin实例
    const arrHtmlPlugins = options.webpackConfig.plugins.filter(item => item instanceof HtmlWebpackPlugin);
    // 建立webpack.entry和mock配置文件的映射关系
    webpackEntryToMapMock(options);
    // 监听mock文件
    watchMockFile(options);
}

function serviceMockMiddleware(options = {
    filename: 'mock',       // mock配置文件名称
    webpackConfig: null,    // webpack配置
    server: null,           // webpack-dev-server 对象
    publicPath: ''          //
}) {
    // 初始化中间件，监听mock文件目录或文件
    initialize(options);
    return function smm(req, res, next) {
        if (path.parse(req.url.split('?')[0]).ext || !req.headers.referer) { // 不是ajax请求 || 没有webpack配置 || req.headers.referer为undefied，表示直接在浏览器访问接口，不走mock
            return next();
        } else {
            logUpdate.clear();
		        let pathname = new URL(req.headers.referer).pathname;
            pathname = ['.html', '.htm'].includes(path.parse(pathname).ext) ? pathname : 'index.html';
		        pathname = pathname.replace(options.publicPath, '');
		        pathname = pathname.indexOf('/') === 0 ? pathname.substr(1) : pathname;
            const table = new Table({head: ['请求路径', '开关[enable]'], style: {border: []}});
            if (options.mapMock[pathname]) {    // 有mock配置文件映射
                // 请求路径对应的mock文件路径
                const mapUrlByFile = {};
                // 获取mock文件配置，如果有多个mock配置文件，则合并mock配置文件
                const mockjson = options.mapMock[pathname].reduce((previousValue, currentValue) => {
                    const mockfile = currentValue;
                    // console.log(mockfile);
                    if (fe.existsSync(mockfile)) {
                        try {
                            // const strFileContent = fs.readFileSync(mockfile).toString().trim();
                            delete require.cache[mockfile];
                            const mockjson = require(mockfile);
                            if (!Object.keys(mockjson).length) {
                                return previousValue;
                            }
                            // const mockjson = eval(`(${strFileContent})`);
                            table.push([mockfile + ' 文件mock总开关', `${mockjson.enable === false ? 'false' : 'true'}`]);
                            if (mockjson.enable === false) {
                                return previousValue
                            } else {
                                // 记录请求url对应的mock文件
                                Object.keys(mockjson).forEach(key => mapUrlByFile[key] = mockfile);
                                return { ...previousValue, ...mockjson }
                            }
                        } catch (e) {
                            if (e.message.indexOf('Unexpected') !== -1) console.error(chalk.red('语法错误：', mockfile + '有错误，请检查您的语法'));
                            console.error(e.stack);
                            return previousValue;
                        }
                    }
                }, {});

                if (!mockjson || mockjson.enable === false) {
                    mockjson && logUpdate(table.toString());
                    return next();
                } else {
                    let mockdata = mockjson[url.parse(req.url).pathname];
                    if (typeof mockdata === 'function') { // 如果是一个函数，则执行函数，并传入请求参数和req，res对象
                        try {
                            mockdata = mockdata({ ...req.query, ...req.body }, req, res);
                        } catch (e) {
                            const pathname = url.parse(req.url).pathname;
                            console.error(chalk.red(pathname, '函数语法错误，请检测您的mock文件：', mapUrlByFile[pathname]));
                            console.error(e.message);
                            // console.error(e.trace());
                        }
                        if (!mockdata) {
                            console.error(url.parse(req.url).pathname + '函数没有返回值，返回内容为：' + mockdata);
                            return next();
                        } else if (mockdata.enable || mockdata.enable === void 0) {
                            table.push([url.parse(req.url).pathname, true]);
                            // console.log(table.toString());
                            // console.log(url.parse(req.url).pathname + ' => enable：', mockdata.enable);
                            delete mockdata.enable;
                            res.setHeader('service-mock-middleware', 'This is a mock data !');
                            res.setHeader('service-mock-middleware-file', mapUrlByFile[url.parse(req.url).pathname]);
                            res.json(mockdata).end();
                            // res.end();
                            setTimeout(() => {
                                logUpdate(table.toString());
                            },0)
                        } else {
                            table.push([url.parse(req.url).pathname, false]);
                            logUpdate(table.toString());
                            return next();
                        }
                    } else if (typeof mockdata === 'object') {
                        if (mockdata.enable === false) {
                            table.push([url.parse(req.url).pathname, false]);
                            logUpdate(table.toString());
                            return next();
                        } else {
                            table.push([url.parse(req.url).pathname, true]);
                            delete mockdata.enable;
                            res.setHeader('service-mock-middleware', 'This is a mock data !');
                            res.setHeader('service-mock-middleware-file', mapUrlByFile[url.parse(req.url).pathname]);
                            res.json(mockdata);
                            res.end();
                            logUpdate(table.toString());
                        }
                    } else {
                        return next();
                    }
                }
            } else {                            // 没有mock配置文件
                return next();
            }
        }
    }
}

module.exports = serviceMockMiddleware;
