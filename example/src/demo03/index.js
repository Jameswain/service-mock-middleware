import $ from '../common/ajax'

$.get('/search_subjects', res => {
    console.log('/search_subjects =>', JSON.parse(res));
});

$.get('/api/demo');
