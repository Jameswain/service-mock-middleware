const Table = require('cli-table3');
const path = require('path');
const fs = require('fs');
const fe = require('fs-extra');
const url = require('url');
const {URL} = url;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const logUpdate = require('log-update');
const chalk = require('chalk');
const semver = require('semver');
const packageConfig = require('./package.json');
const currentVersion = semver.clean(process.version);

/**
 * 设置index.html和mock文件映射关系
 * @param p - htmlWebpackPlugin对象
 * @param options - 中间件配置选项
 */
function setMapMock(p, options, watchTarget) {
	if (!fe.existsSync(watchTarget)) return;
	if (options.mapMock[p.options.filename]) {
		options.mapMock[p.options.filename].push(watchTarget);
	} else {
		options.mapMock[p.options.filename] = [watchTarget];
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
				const watchTarget = path.join(path.parse(path.resolve(entry)).dir, filename);
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
 * 无缓存require
 */
function noCacheRequire(moduleId, options) {
	const arrExt = ['.js', '.node'];
	try {
		const stat = fs.statSync(moduleId);
		if (stat.isFile() && arrExt.includes(path.parse(moduleId).ext)) {
			const result = require(moduleId);
			delete require.cache[moduleId];
			if (result.enable === false) return {};
			// 记录mock文件路径
			Object.keys(result).forEach(key => options.mapUrlByFile[key] = moduleId);
			return result;
		} else if (stat.isDirectory()) {
			return fs.readdirSync(moduleId).filter(f => arrExt.includes(path.parse(f).ext)).reduce((previous, current) => {
				const filename = path.join(moduleId, current);
				const result = noCacheRequire(filename, options);
				return {...previous, ...result};
			}, {});
		}
	} catch (e) {
		return {};
	}
}

/**
 * 监听回调函数
 */
function watchCallback(options) {
	// 让浏览器刷新
	if (options.server) {
		readMockJson(options);
		options.server.sockWrite(options.server.sockets, 'content-changed');
	} else {
		console.log(chalk.red('对不起，您没有传入webpack-dev-server对象，无法使用浏览器自动刷新功能！'));
	}
}

/**
 * 监听mock配置文件
 */
function readMockJson(options, callback) {
	Object.keys(options.mapMock).forEach(key => {
		let arrWatchTarget = options.mapMock[key];
		arrWatchTarget.forEach(watchTarget => {
			const stat = fs.statSync(watchTarget);
			// 读取mock数据
			if (stat.isFile()) watchTarget = path.parse(watchTarget).dir;
			if (options.mapMockJson[key]) {
				options.mapMockJson[key] = {
					...options.mapMockJson[key],
					...noCacheRequire(watchTarget, options)
				}
			} else {
				options.mapMockJson[key] = noCacheRequire(watchTarget, options)
			}
			if (typeof callback === 'function') callback(watchTarget);
		});
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
	// mock路径和mock数据的映射
	options.mapMockJson = {};
	// mock路径与mock文件的映射
	options.mapUrlByFile = {};
	// 建立webpack.entry和mock配置文件的映射关系
	webpackEntryToMapMock(options);
	// 监听mock文件
	readMockJson(options , watchTarget => fs.watch(watchTarget, () => watchCallback(options)));
}

/**
 * 返回mock数据给客户端
 */
function responseMockData(req, res, table, mockdata, mapUrlByFile) {
	const pathname = url.parse(req.url).pathname;
	const delaytime = mockdata.delaytime;
	delete mockdata.enable;
	delete mockdata.delaytime;
	table.push([pathname, true]);
	logUpdate(table.toString());
	const runResponse = () => {
		res.setHeader('service-mock-middleware-info', 'This is a mock data !');
		res.setHeader('service-mock-middleware-file', mapUrlByFile[pathname]);
		res.json(mockdata).end();
	};
	if (delaytime) {
		setTimeout(runResponse, delaytime);
	} else {
		runResponse();
	}
}

function serviceMockMiddleware(options = {
	filename: 'mock',       // mock配置文件名称
	webpackConfig: null,    // webpack配置
	server: null,           // webpack-dev-server 对象
	publicPath: ''          // publicPath路径
}) {
	// 初始化中间件，监听mock文件目录或文件
	initialize(options);
	return (req, res, next) => {
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
				const {mapUrlByFile} = options;
				// 获取mock文件配置，如果有多个mock配置文件，则合并mock配置文件
				const mockjson = options.mapMockJson[pathname];
				if (!mockjson || mockjson.enable === false) {
					mockjson && logUpdate(table.toString());
					return next();
				} else {
					let mockdata = mockjson[url.parse(req.url).pathname];
					if (typeof mockdata === 'function') { // 如果是一个函数，则执行函数，并传入请求参数和req，res对象
						try {
							mockdata = mockdata({...req.query, ...req.body}, req, res);
						} catch (e) {
							const pathname = url.parse(req.url).pathname;
							console.error(chalk.red(pathname, '函数语法错误，请检测您的mock文件：', mapUrlByFile[pathname]));
							console.error(e.message);
						}
						if (!mockdata) {
							console.error(url.parse(req.url).pathname + '函数没有返回值，返回内容为：' + mockdata);
							return next();
						} else if (mockdata.enable || mockdata.enable === void 0) {
							responseMockData(req, res, table, mockdata, mapUrlByFile);
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
							responseMockData(req, res, table, mockdata, mapUrlByFile);
						}
					} else {
						return next();
					}
				}
			} else {                            // 没有mock配置文件
				return next();
			}
		}
	};
}

module.exports = serviceMockMiddleware;
