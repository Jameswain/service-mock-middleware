module.exports = {
  // enable: false,
  '/video_list': ({uid}) => {
    return {
      // enable: false,
      code: 200,
      msg: '视频列表',
      data: [
        {
          id: 1,
          url: 'www.baidu.com'
        },
        {
          id: 2,
          url: 'www.jd.com'
        },
        {
          id: 3,
          url: 'www.taobao.com'
        },
        {
          id: 4,
          url: 'www.qq.com'
        }
      ]
    }
  },
  '/video_info': ({id}) => {
    return {
      code: 200,
      msg: '请求成功',
      data: {
        id: 1,
        name: '视频名称',
        url: 'www.baidu.com'
      }
    }
  }
}
