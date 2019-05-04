module.exports = {
    '/api/user': (params, req, res) => {
        console.log('/api/user =>', params);
        return {
            name: 'Jameswain',
            age: 18
        }
    }
}
