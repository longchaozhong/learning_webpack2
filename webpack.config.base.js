let path = require('path');
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ManifestPlugin = require('webpack-manifest-plugin');
let ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
let ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        main: './src/index.js'
    },
    output: null,
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
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
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        /**
         * 相当于在每个模块中执行：
         *      let $ = require('jquery');
         *      let jQuery = require('jquery');
         *
         * 作用：
         *      1、对于常用模块，不用每个木块都去引用
         *      2、改造遗留模块（还可以使用imports-loader、exports-loader、script-loader）
         */
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),

        new HtmlWebpackPlugin({
            inject: false,//是否由插件注入标签，false表示用户手动配置（模板语法）
            template: path.resolve('./src/index.html'),//模板路径
            filename: path.resolve('./index.html')//输出路径
        }),
        /**
         * 提取js公共代码块，此时生成的各个文件都包含webpack需要的runtime code；
         * 由于文件一直在变化，导致runtime code也一直在变化，因此生成的文件都在变化（包括提取的公共库）
         */
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common', // Specify the common bundle's name.
            minChunks: function (module) {
                // this assumes your vendor imports exist in the node_modules directory
                return module.context && module.context.indexOf('node_modules') !== -1;
            }
        }),
        /**
         * >>>再次提取公共代码块，将runtime code单独存放，使生成的common文件不随业务代码变化，但不能保证不变化；
         * >>>此种情况下，当公共模块引入顺序或次数变化时可能导致common文件变化，根本原因是webpack使用模块的引用顺序作为模块的ID，
         *    因此当模块引用顺序变了时，模块的ID会变化，解决方案可以使用webpack.NamedModulesPlugin；
         * >>>webpack.NamedModulesPlugin会使用模块的路径做为ID，因此只要不重命名模块，ID就不会变，但会导致ID过长，模块较多时会
         *    使打包体积增大；
         * >>>完美解决方案：HashedModuleIdsPlugin,这个插件会根据模块的相对路径生成一个长度只有四位的字符串作为模块的 id，既隐藏
         *    了模块的路径信息，又减少了模块 id 的长度
         *
         * 参考文档：http://www.tuicool.com/articles/3UVbEr6
         */
        //CommonChunksPlugin will now extract all the common modules from common and main bundles
        new webpack.optimize.CommonsChunkPlugin({
            //But since there are no more common modules between them we end up with just the runtime
            //code included in the manifest file
            name: 'manifest'
        }),

        /**
         * 这个插件会根据模块的相对路径生成一个长度只有四位的字符串作为模块的 id
         */
        new webpack.HashedModuleIdsPlugin(),

        //提取样式
        new ExtractTextPlugin("styles.css"),

        //生成map文件
        new webpack.SourceMapDevToolPlugin({
            filename: '[name].map',
            exclude: /^common$/    //options.test / options.include / options.exclude (string|RegExp|Array):
        }),

        //TODO 待研究
        //完整的资源清单（图片、样式、脚本）
        new ManifestPlugin({
            fileName: 'manifest.json'
        }),
        //脚本资源清单（Hash值）
        new ChunkManifestPlugin({
            filename: 'chunkManifest.json',
            manifestletiable: 'webpackManifest',
            inlineManifest: true
        })

    ]
};
