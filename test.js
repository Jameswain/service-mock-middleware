const HtmlWebpackPlugin = require('html-webpack-plugin');

const arr = [new HtmlWebpackPlugin()];

console.log(arr[0] instanceof HtmlWebpackPlugin);

console.log(arr.filter(p => p instanceof HtmlWebpackPlugin))


console.log(process.execPath)
console.log(__dirname)
console.log(process.cwd())
