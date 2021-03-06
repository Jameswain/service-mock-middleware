const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const serviceMockMiddleware = require('../middleware');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src', 'demo03', 'index.js'),
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
            // 使用mock中间件
            app.use(serviceMockMiddleware({ webpackConfig: module.exports, server }));
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname,'src/common/index.html'),          // html模版
            filename: path.resolve(__dirname, 'dist', 'index.html'),            // html输出位置
        })
    ]
}
