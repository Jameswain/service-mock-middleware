module.exports = {
    // enable: false,              // 全局mock开关，默认为false关闭状态
    '/search_subjects': (params) => {
        console.log('/aweme_list =>', params);
        return {
            enable: true,       // 开启接口mock数据，默认为关闭状态
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
                },
                {
                    'rate': '6.2',
                    'cover_x': 1500,
                    'title': '死寂',
                    'url': 'https://movie.douban.com/subject/27050133/',
                    'playable': false,
                    'cover': 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2552168278.webp',
                    'id': '27050133',
                    'cover_y': 2222,
                    'is_new': true
                },
                {
                    'rate': '6.5',
                    'cover_x': 631,
                    'title': '大奥 最终章',
                    'url': 'https://movie.douban.com/subject/30466625/',
                    'playable': false,
                    'cover': 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2552367600.webp',
                    'id': '30466625',
                    'cover_y': 900,
                    'is_new': true
                },
                {
                    'rate': '6.2',
                    'cover_x': 1433,
                    'title': '欢迎来到马文镇',
                    'url': 'https://movie.douban.com/subject/26369709/',
                    'playable': false,
                    'cover': 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2540630419.webp',
                    'id': '26369709',
                    'cover_y': 2048,
                    'is_new': true
                }
            ]
        }
    },
    '/api/demo': {
        enable: !true,
        'rate': '6.2',
        'cover_x': 1433,
        'title': '欢迎来到马文镇',
        'url': 'https://movie.douban.com/subject/26369709/',
        'playable': false,
        'cover': 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2540630419.webp',
        'id': '26369709',
        'cover_y': 2048,
        'is_new': true
    }
}
