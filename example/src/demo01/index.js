import $ from '../common/ajax'

$.post('/search_subjects', { name: 'jameswain', desc: '这是中文描述🀄️' },res => {
    console.log('/search_subjects =>', JSON.parse(res));
});

$.post('/api/demo');
