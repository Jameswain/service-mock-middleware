import $ from '../common/ajax'
import { arrRoles } from './mock/data'

/**
 * 查询
 */
function list() {
    $.getJSON('/api/list', arrRoles => {
        const arrHtmls = arrRoles.map(({ name, cover }, i) => (`
        <tr>
          <td align="center">${i + 1}</td>
          <td width="60" align="center">${name}</td>
          <td><img src="${cover}" alt=""/></td>
          <td width="100" align="center">
            <button id="del-${i}" val="${i}">删除</button>
            <button id="edit-${i}" val="${i}">修改</button>
          </td>
        </tr>
      `));
        document.querySelector('tbody').innerHTML = arrHtmls.join('');
    });
}

/**
 * 添加
 */
function add() {
    document.querySelector('#add').addEventListener('click', function () {
        $.post('/api/add?age=28', arrRoles[parseInt(Math.random() * arrRoles.length)], function (res) {
            console.log(res);
            list();
        });
    });
}

/**
 * 删除
 */
function del(id) {
    $.get(`/api/del?id=${id}`, function (res) {
        console.log(res);
        list();
    });
}

/**
 * 修改
 */
function edit(id) {
    $.post(`/api/edit`, { id, ...arrRoles[parseInt(Math.random() * arrRoles.length)] } , function (res) {
        console.log(res);
        list();
    });
}

/**
 * 清空
 */
function clear() {
    $.get(`/api/clear`, function (res) {
        console.log(res);
        list();
    });
}

function body() {
    document.querySelector('body').addEventListener('click', function (e) {
        const arr = e.target.id.split('-');
        console.log(arr)
        if (arr[0] === 'del') {
            del(arr[1])
        } else if (arr[0] === 'edit') {
            edit(arr[1]);
        } else if (arr[0] === 'clear') {
            clear();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {// 删除
    add();
    body();
    list();
});
