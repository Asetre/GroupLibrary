var webpack = require('webpack')
var path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")

var BUILD_DIR = path.resolve(__dirname, 'public/')
var APP_DIR = path.resolve(__dirname, 'client/js')

var config = {
    entry: ['babel-polyfill', APP_DIR + '/index.js'],
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    module : {
        loaders : [
            {
                test : /\.jsx?/,
                use: ['babel-loader']
            },
            {
                test: /\.html$/,
                use: [ 'file-loader?name=[name].[ext]', 'extract-loader', 'html-loader']
            },
            {
                test: /\.(jpg|png|gif)$/,
                loader: 'url-loader',
                options: {
                    limit: 4500
                }
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'main.css'
        })
    ]
}

module.exports = config
