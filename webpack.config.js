let path = require('path');
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        // publicPath:'/modules/js/lib/spy/dist/'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader', "webpack-module-hot-accept"]
            },
            {
                test: /\.html/,
                exclude: /src\/index\.html/,
                use: 'html-loader'
            },
            {
                test: /\.(eot|ttf|svg|woff2?)(\?.*)?$/,
                use: 'url-loader'
            }
        ]
    },
    devtool: 'cheap-module-source-map',
    plugins: [
        /**
         * 全局开启热模块加载
         */
        new webpack.HotModuleReplacementPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            _: 'lodash'
        }),

        new HtmlWebpackPlugin({
            inject: false,//是否由插件注入标签，false表示用户手动配置（模板语法）
            template: path.resolve('./src/index.html'),//模板路径
            filename: path.resolve('./dist/index.html')//输出路径
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'common', // Specify the common bundle's name.
            minChunks: function (module) {
                // this assumes your vendor imports exist in the node_modules directory
                return module.context && module.context.indexOf('node_modules') !== -1;
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            //But since there are no more common modules between them we end up with just the runtime
            //code included in the manifest file
            name: 'manifest'
        }),

        /**
         * 这个插件会根据模块的相对路径生成一个长度只有四位的字符串作为模块的 id
         */
        //new webpack.HashedModuleIdsPlugin()
    ],

    devServer: {
        contentBase: path.join(__dirname, "./dist"),//服务器内容根目录，可以是数组
        port: 8888,//端口
        hot: true
    }
};
