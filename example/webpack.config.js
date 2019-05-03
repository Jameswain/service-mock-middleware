const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const serviceMockMiddleware = require('../middleware');

module.exports = {
    mode: 'development',
    // entry: path.resolve(__dirname, 'src', 'demo1', 'index.js'),
    // entry: [
    //     path.resolve(__dirname, 'src', 'demo1', 'index.js'),
    //     './src/demo2/main.js'
    // ],
    entry: {
        app: path.resolve(__dirname, 'src', 'demo1', 'index.js'),   // 必须使用绝对路径
        main: path.resolve(__dirname, 'src/demo2/main.js')          // 必须使用相对路径
    },
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
            title: 'index',                                                     // html默认标题
            chunks: ['app' ]                                                    // entry对象的key，一个key就是一个chunk
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src', 'common', 'index.html'),
            filename: path.resolve(__dirname, 'dist', 'main.html'),
            title: 'main',
            chunks: [ 'main' ]
        })
    ]
}
