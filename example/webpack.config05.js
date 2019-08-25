const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const bodyParser = require('body-parser');
const serviceMockMiddleware = require('../middleware');

const publicPath = '/react';

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src', 'demo05', 'index.js'),
    output: {
        filename: '[name].[hash].js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    devServer: {
        publicPath,
        /**
         * 提供在服务器内部所有其他中间件之前执行自定义中间件的能力。
         * @param app
         * @param server
         */
        before(app, server) {
            // 创建 application/json（POST请求）parser 解析器中间件：它把post请求体解析成json放在req.body中
            app.use(bodyParser.json());
            // POST 创建 application/x-www-form-urlencoded URL编码解析器中间件
            app.use(bodyParser.urlencoded({ extended: false }));
            // 使用mock中间件
            app.use(serviceMockMiddleware({
                /** 必传参数：webpack配置 */
                webpackConfig: module.exports,
                /** 必传参数：webpack-dev-server对象，用于控制浏览器刷新 */
                server,
                /** 可选参数：devServer.publicPath，当devServer配置中配置了publicPath字段后，就必须要把这个配置传给该中间件*/
                publicPath
            }));
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname,'src/common/index.html'),          // html模版
            filename: path.resolve(__dirname, 'dist', 'index.html'),            // html输出位置
        })
    ]
}
