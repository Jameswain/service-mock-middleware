import $ from '../common/ajax'

$.post('/search_subjects', { name: 'jameswain' },res => {
    console.log('/search_subjects =>', JSON.parse(res));
});

$.post('/api/demo');
