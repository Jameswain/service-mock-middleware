import $ from '../common/ajax'

console.log('main.js.....');

$.get('/api/user?uid=12312312');
$.get('/video_list');
$.post('/video_info?uid=88888', { id: 6138737, name: 'Jameswain' });
