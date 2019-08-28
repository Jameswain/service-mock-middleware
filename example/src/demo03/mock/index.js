//  mock配置文件，key就是接口的URL地址，value可以是对象，或者函数，函数更灵活，函数有三个参数，分别是：请求参数，request对象，response对象
const ARR_ROLES = 'ARR_ROLES';
module.exports = {
    /**
     * 增
     * @param params 请求参数
     * @param req 请求对象，通过它获取请求相关信息
     * @param req.app 表示服务级范围，app.set存储数据到服务上，服务没有关闭数据就一直在。
     * @param rep 响应对象，通过它设置响应信息
     */
    '/api/add': (params, req, res) => {
        // 从req.app中获取数据
        const arrRoles = req.app.get(ARR_ROLES) || [];
        // 角色数组前边添加数据
        arrRoles.unshift(params);
        // 将添加的数据保存到req.app里
        req.app.set(ARR_ROLES, arrRoles);
        return {
            status: 0,
            message: '增加成功'
        };
    },
    /**
     * 删
     * @param params 请求参数
     * @param req 请求对象，通过它获取请求相关信息
     * @param rep 响应对象，通过它设置响应信息
     */
    '/api/del': ({ id }, { app }, res) => {
        const arrRoles = app.get(ARR_ROLES);
        arrRoles.splice(id, 1);
        app.set(ARR_ROLES);
        return {
            status: 0,
            message: '删除成功'
        }
    },
    /**
     * 改
     * @param id
     * @param app
     */
    '/api/edit': (params, { app }) => {
        const arrRoles = app.get(ARR_ROLES);
        arrRoles[params.id] = params;
        app.set(ARR_ROLES);
        return {
            status: 0,
            message: '修改成功'
        }
    },
    /**
     * 查
     * @param params 请求参数
     * @param req 请求对象，通过它获取请求相关信息
     * @param rep 响应对象，通过它设置响应信息
     */
    '/api/list': (params, req, res) => {
        const arrRoles = req.app.get(ARR_ROLES) || [];
        return arrRoles;
    },
    /**
     * 清空
     * @param params
     * @param req
     * @param res
     */
    '/api/clear': (params, req, res) => {
        req.app.set(ARR_ROLES, []);
        return {
            // 接口延时3000毫秒
            delaytime: 3000,
            status: 0,
            message: '清空成功'
        }
    }
}
