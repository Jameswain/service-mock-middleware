![build](https://img.shields.io/badge/build-passing-green.svg)
![dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-orange.svg)

<div align="center">
    <h1>service-mock-middleware</h1>
</div>

​		这是express的一个简单的中间件，它通过拦截html页面上发出的ajax请求与mock配置文件中URL进行匹配，如果匹配成功则直接返回mock配置文件中返回的mock数据。mock配置位置默认为webpack入口文件同级目录下的mock文件夹下的index.js文件。

使用这个中间件的好处如下：

  **1、在服务端没有提供接口的情况下进行一个真实的http请求数据的mock，进行正常的业务开发，提高开发效率。**

  **2、mock配置文件可以接收到前端ajax请求过来的参数，并且可以根据不同的请求参数，返回不同的mock数据。**

  **3、在开发过程中我们经常会遇到服务端的某个接口出现错误问题，例如：服务端的一个状态改变的接口，出现错误。这时候就会阻塞我们的业务流程，以前我们可能就需要等待服务的修复后才能继续往下开发。使用这个mock中间件我们在开发阶段可以按照正常的业务流程返回正确的mock数据，等服务端接口修复了我们把mock数据开关一关马上就可以验证效果。**

  **4、这个mock中间件只用于开发阶段，而且mock数据不会造成代码污染，就是当你对你的项目进行生产环境的代码构建时完全不需要关心mock数据，不需要做任何的配置，mock的数据也不会被打包。传统前端的mock数据拦截，如果不使用webpack全局变量的区分，mock数据会被打包到生产环境的代码中，而且它并没有发出一个真实的http请求。**

  **5、使用、配置简单、灵活、支持请求参数接收，可以返回灵活丰富的mock数据，满足各种业务场景。**


<h2 align="center">安装</h2>
``` shell
npm install service-mock-middleware --save-dev
```

<h2 align="center">使用</h2>
<h3 align="left">demo01：Object类型entry</h3>
**1、在webpack.config.js配置文件中使用中间件：**

``` javascript
// example/webpack.config01.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const bodyParser = require('body-parser');	
const serviceMockMiddleware = require('service-mock-middleware');

module.exports = {
    mode: 'development',
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
            // POST 创建 application/x-www-form-urlencoded 编码解析，用于POST请求参数解析
            app.use(bodyParser.urlencoded({ extended: false }));
            // 使用service-mock-middleware中间件
            app.use(serviceMockMiddleware({ 
              webpackConfig: module.exports, // 必传参数，webpack配置
              server 	 // 必传参数，webpack-dev-server对象，用于控制浏览器刷新
            }));
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname,'src/common/index.html'),        // html模版
            filename: path.resolve(__dirname, 'dist', 'index.html'),          // html输出位置
            title: 'index',                            // html默认标题
            chunks: ['app' ]                           // entry对象的key，一个key就是一个chunk
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src', 'common', 'index.html'),
            filename: path.resolve(__dirname, 'dist', 'main.html'),
            title: 'main',
            chunks: [ 'main' ]
        })
    ]
}
```
[example/webpack.config01.js](https://github.com/Jameswain/service-mock-middleware/blob/master/example/webpack.config01.js)

**2、webpack入口文件的同级目录下创建mock配置文件：**

![001](https://raw.githubusercontent.com/Jameswain/service-mock-middleware/master/example/imgs/001.jpg) 

``` javascript
// example/src/demo01/mock/index.js      mock配置文件，key就是接口的URL地址，value可以是对象，或者函数，函数更灵活，函数有三个参数，分别是：请求参数，request对象，response对象
module.exports = {
    enable: true,              // 全局mock开关，如果不写，默认为开启状态，如果设置为false，表示关闭整个配置文件的mock配置，等服务端的接口准备ready后，可以将这个字段设置为false
    '/search_subjects': (params, req, res) => {
        console.log('/aweme_list =>', params);
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

            ]
        }
    },
    '/api/demo': {
        enable: false,      // 关闭该接口的mock数据
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
```

[example/src/demo01/mock/index.js](https://github.com/Jameswain/service-mock-middleware/blob/master/example/src/demo01/mock/index.js)

**3、发送ajax请求，获取mock数据：**

``` javascript
// example/src/demo01/index.js
import $ from '../common/ajax'
$.get('/search_subjects', res => {
    console.log('/search_subjects =>', res);
})
$.get('/api/demo');
```

[example/src/demo01/index.js](https://github.com/Jameswain/service-mock-middleware/blob/v1.2.1/example/src/demo01/index.js)

浏览器输入：`http://localhost:8080/index.html` 和 `http://localhost:8080/main.html` 查看效果

**运行效果：**
![a002](https://raw.githubusercontent.com/Jameswain/service-mock-middleware/master/example/imgs/002.jpg)

* 通过运行结果，我们可以发现 **/search_subjects** 接口走的就是我们编写的mock数据，而 **/api/demo** 的mock开关没有打开，所以没有走mock数据，而且mock配置文件每次改变保存浏览器都会自动刷新。
![003](https://raw.githubusercontent.com/Jameswain/IMG/master/20190804160457.jpg)
* 如果你的ajax请求走的是mock数据，它的`response`会多了一个`service-mock-middleware`的响应头告诉你，你这个http请求走的是mock数据，`service-mock-middleware-file`响应头告诉你匹配的mock配置文件。
![004](https://raw.githubusercontent.com/Jameswain/IMG/master/20190804160803.jpg)
* 不仅如此，我们的终端(Terminal)也会有一个表格告诉你，你当前访问的接口mock的开关状态


<h2 align="center">options</h2>
`options`使用`service-mock-middleware`中间件时的一些必传和可选参数，通过可选参数可以修改中间件的一些默认行为。`options`是一个`object`对象，使用例子如下：

```javascript
const serviceMockMiddleware = require('service-mock-middleware');
const options = { webpackConfig, server };
const smw = serviceMockMiddleware(options)
```

| 参数名称        | 是否必传 | 描述                                                         |
| --------------- | -------- | ------------------------------------------------------------ |
| `webpackConfig` | **是**   | webpack配置                                                  |
| `server`        | **是**   | webpack-dev-server对象，用于控制浏览器刷新                   |
| `filename`      | 否       | 设置mock配置文件所在的`文件夹`或`文件`的相对路径，相对于`webpack`的`entry`路径。<br />例1：`filename: '/mock-data/other.js'`<br />例2：`filename: '/mock-data/'`<br />例3：`filename: '/mock-data'` |

<h2 align="center">mock配置说明</h2>

* mock配置文件是通过`key`和`value`形式配置，`key`就是你要请求的`URL`，`value`只支持两种类型：`object`和`function`
* `function(params, req, res)`形式的`value`最为灵活，它传入三个参数供你使用：
  * `params`：这个就是你`ajax`请求时传入的参数
  * `req`：`request`对象，你可以使用它获取任何请求相关的信息，你可以通过`req.app`获取`application`对象将一些数据存储到`application`里，完成一个服务级的增、删、改、查。
  * `res`：`response`对象，你可以使用设置一些响应头等操作
* `enable`：mock开关，放在最外层可以控制整个文件的开关，放在单个`URL`的`value`里可以控制单个接口的mock开关

<h2 align="center">运行例子</h2>

在源码仓库中，有一些例子，可以把这个源码仓库克隆到本地，运行起来，看一下效果，具体操作如下：

``` javascript
git clone https://github.com/Jameswain/service-mock-middleware.git   // 克隆源码到本地磁盘
npm install				      // 安装依赖
npm run example01		    // 运行例子01，访问http://localhost:8080
npm run example02		    // 运行例子02，访问http://localhost:8080
npm run example03		    // 运行例子03，访问http://localhost:8080
npm run example04				// 运行例子04，访问http://localhost:8080
```

<h3>demo02：使用mockjs模块和自定义模块进行mock数据</h3>

**1、在webpack配置文件中使用mock中间件：**

```javascript
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
            // POST 创建 application/x-www-form-urlencoded 编码解析，POST参数解析
            app.use(bodyParser.urlencoded({ extended: false }));
            // 使用mock中间件
            app.use(serviceMockMiddleware({ webpackConfig: module.exports, server }));
        }
    },
    plugins: [
        new HtmlWebpackPlugin()
    ]
}
```

**2、在第一个入口文件对应的mock文件夹中进行mock数据配置：**

![image-20190804164554113](/Users/jameswain/Library/Application Support/typora-user-images/image-20190804164554113.png)

* [example/src/demo01/mock/index.js](https://github.com/Jameswain/service-mock-middleware/blob/v1.2.1/example/src/demo01/mock/index.js)
* [example/src/demo01/mock/data.js](https://github.com/Jameswain/service-mock-middleware/blob/v1.2.1/example/src/demo01/mock/data.js)

**3、在第一个入口文件中发送ajax请求：**

![image-20190804171953450](/Users/jameswain/Library/Application Support/typora-user-images/image-20190804171953450.png)

* [example/src/demo01/mock/index.js](https://github.com/Jameswain/service-mock-middleware/blob/v1.2.1/example/src/demo01/mock/index.js)

**4、在第二个入口文件对应的mock文件夹中进行mock数据配置：**

![image-20190804172359682](/Users/jameswain/Library/Application Support/typora-user-images/image-20190804172359682.png)

`demo02/mock`文件夹中有三个mock配置文件，其中`auth.js`文件是空的，`service-mock-middleware`会自动过滤掉这种文件，`service-mock-middleware`中间件会自动识别`index.js`和`player.js`文件中的`mock`数据配置，这种`mock`配置文件拆分比较适合在大型PC项目中进行使用。

* [example/src/demo02/mock/auth.js](example/src/demo02/mock/auth.js)
* [example/src/demo02/mock/index.js](example/src/demo02/mock/index.js)
* [example/src/demo02/mock/player.js](example/src/demo02/mock/player.js)

**5、**