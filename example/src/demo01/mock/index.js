// 可以直接引入系统模块
const path = require('path');
// 支持引入第三方模块
const Mock = require('mockjs');
const { arrMovies, getMovies } = require('./data');

//  mock配置文件，key就是接口的URL地址，value可以是对象，或者函数，函数更灵活，函数有三个参数，分别是：请求参数，request对象，response对象
module.exports = {
    enable: true,              // 全局mock开关，如果不写，默认为开启状态， 如果设置为false，表示关闭整个配置文件的mock配置，等服务端的接口准备ready后，可以将这个字段设置为false
    '/search_subjects': (params, req, res) => {
        // console.log('/search_subjects =>', params);
        return {
            // enable: true,  // 开启接口mock数据，如果不写，默认为开启状态
            subjects: [
                {
                    'rate': '7.0',
                    'cover_x': 7142,
                    'title': '飞驰人生',
                    'url': 'https://movie.douban.com/subject/30163509/',
                    'playable': true,
                    'cover': 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2542973862.webp',
                    'id': '30163509',
                    'cover_y': 10000,
                    'is_new': false
                },
                {
                    'rate': '5.7',
                    'cover_x': 1078,
                    'title': '新喜剧之王',
                    'url': 'https://movie.douban.com/subject/4840388/',
                    'playable': true,
                    'cover': 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2541240741.webp',
                    'id': '4840388',
                    'cover_y': 1512,
                    'is_new': false
                }
            ],
            diskPath: path.resolve(__dirname),
            list: Mock.mock({
                'list|10-30': [{
                    'id|+1': 1,
                    'email': '@EMAIL'
                }]
            }).list,
            arrMovies
        }
    },
    '/api/demo': {
        // enable: false,      // 关闭该接口的mock数据
        'rate': '6.2',
        'cover_x': 1433,
        'title': '欢迎来到马文镇',
        'url': 'https://movie.douban.com/subject/26369709/',
        'playable': false,
        'cover': 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2540630419.webp',
        'id': '26369709',
        'cover_y': 2048,
        'is_new': true,
        arrMovies: getMovies()
    }
}
