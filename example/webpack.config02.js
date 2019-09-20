const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const bodyParser = require('body-parser');
const serviceMockMiddleware = require('../middleware');

module.exports = {
    mode: 'development',
    entry: [
        path.resolve(__dirname, 'src', 'demo01', 'index.js'),   // 必须使用绝对路径
        path.resolve(__dirname, 'src/demo02/main.js')           // 必须使用绝对路径
    ],
    output: {
        filename: '[name].[hash].js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    devServer: {
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
            app.use(serviceMockMiddleware({ webpackConfig: module.exports }));
        }
    },
    plugins: [
        new HtmlWebpackPlugin()
    ]
}
