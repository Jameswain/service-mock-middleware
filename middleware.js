const Table = require('cli-table2');
const path = require('path');
const fs = require('fs');
const fe = require('fs-extra');
const url = require('url');
const { URL } = url;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const logUpdate = require("log-update");
const chalk = require('chalk');

/**
 * 初始化mock中间件
 * @param options 中间件配置
 */
function initialize(options) {
    // 默认要监听的文件或路径
    options.filename = options.filename || '/mock';
    // 监听回调函数
    const watchCallback = () => {
        // 让浏览器刷新
        if (options.server) {
            options.server.sockWrite(options.server.sockets, 'content-changed');
        } else {
            console.log('对不起，您没有传入webpack-dev-server对象，无法使用浏览器自动刷新功能！');
        }
    }
    // mock文件与html文件的映射
    options.mapMock = {};
    // 获取所有的HtmlWebpackPlugin实例
    const arrHtmlPlugins = options.webpackConfig.plugins.filter(item => item instanceof HtmlWebpackPlugin);
    // 监听mock文件变化，以入口文件的目录作为根路径
    if (options.webpackConfig) {
        const filename = options.filename.substr(1);
        if (typeof options.webpackConfig.entry === 'string') {
            arrHtmlPlugins.forEach(p => {
              const watchTarget = path.join(path.parse(path.resolve(options.webpackConfig.entry)).dir, filename);
                if (fe.existsSync(watchTarget)) {
                  const stat = fs.statSync(watchTarget);
                  options.mapMock[p.options.filename] = options.mapMock[p.options.filename] || [];
                  options.mapMock[p.options.filename] = stat.isFile() ? options.mapMock[p.options.filename].push(watchTarget) : options.mapMock[p.options.filename].concat(fs.readdirSync(watchTarget).map(file => path.join(watchTarget, file)));
                }
            });
        } else if (options.webpackConfig.entry instanceof Array) {
            arrHtmlPlugins.forEach(p => {
                options.webpackConfig.entry.forEach(entry => {
                  const watchTarget = path.join(path.parse(path.resolve(entry)).dir, filename);
                  if (fe.existsSync(watchTarget)) {
                    options.mapMock[p.options.filename] = options.mapMock[p.options.filename] || [];
                    const stat = fs.statSync(watchTarget);
                    options.mapMock[p.options.filename] = stat.isFile() ? options.mapMock[p.options.filename].push(watchTarget) : options.mapMock[p.options.filename].concat(fs.readdirSync(watchTarget).map(file => path.join(watchTarget, file)));
                      // if () {
                      //     options.mapMock[p.options.filename].push(path.join(path.parse(path.resolve(entry)).dir, filename));
                      // } else {
                      //     options.mapMock[p.options.filename] = [ path.join(path.parse(path.resolve(entry)).dir, filename) ];
                      // }
                  }
                });
            });
        } else if (Object.prototype.toString.call(options.webpackConfig.entry) === '[object Object]') {
            for (let key in options.webpackConfig.entry) {
                let arrJs = options.webpackConfig.entry[key];
                arrJs = arrJs instanceof Array ? arrJs : [arrJs];
                arrJs = arrJs.filter(js => js.indexOf('node_modules') === -1);
                if (arrJs && arrJs.length) {
                    for (let i = 0; i < arrJs.length; i++) {
                        const watchTarget = path.resolve(path.join(path.parse(arrJs[i]).dir, options.filename));
                        if (fe.existsSync(watchTarget)) {
                            arrHtmlPlugins.forEach(p => {
                                if (p.options.chunks.indexOf(key) !== -1) {
                                    const stat = fs.statSync(watchTarget);
                                    options.mapMock[p.options.filename] = options.mapMock[p.options.filename] || [];
                                    options.mapMock[p.options.filename] = stat.isFile() ? options.mapMock[p.options.filename].push(watchTarget) : options.mapMock[p.options.filename].concat(fs.readdirSync(watchTarget).map(file => path.join(watchTarget, file)));
                                }
                            });
                        }
                    }
                }
            }
        }
    } else {
        throw new Error('请传入webpack配置');
    }

    // 监听mock文件
    [...new Set(Object.values(options.mapMock).reduce((previousValue, currentValue) => ([...previousValue, ...currentValue]), []))].forEach(watchTarget => {
        const stat = fs.statSync(watchTarget);
        if (stat.isFile()) {
            fs.watchFile(watchTarget, watchCallback);
        } else if (stat.isDirectory()) {
            fs.watch(watchTarget, watchCallback);
        }
    });
}

function serviceMockMiddleware(options = {
    filename: 'mock',       // mock配置文件名称
    webpackConfig: null,    // webpack配置
    server: null    // webpack-dev-server 对象
}) {
    // 初始化中间件，监听mock文件目录或文件
    initialize(options);
    return function smm(req, res, next) {
        if (path.parse(req.url.split('?')[0]).ext || !req.headers.referer) { // 不是ajax请求 || 没有webpack配置 || req.headers.referer为undefied，表示直接在浏览器访问接口，不走mock
            return next();
        } else {
            logUpdate('');
            const pathname = new URL(req.headers.referer).pathname.substr(1) || 'index.html';
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
                            const strFileContent = fs.readFileSync(mockfile).toString().trim();
                            if (!strFileContent) {
                                return previousValue;
                            }
                            const mockjson = eval(`(${strFileContent})`);
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
                            mockdata = mockdata(req.query, req, res);
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
