let path = require('path');
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ManifestPlugin = require('webpack-manifest-plugin');
let ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
let ExtractTextPlugin = require("extract-text-webpack-plugin");

let baseConfig = require('./webpack.config.base');

module.exports = Object.assign(baseConfig, {
    output: {
        filename: '[name].[chunkhash].js',//[chunkhash]是依据文件内容生成，与文件内容一一对应,开发环境不建议使用，会增加编译时间
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'cheap-module-source-map',//不包含列信息，同时 loader 的 sourcemap 也被简化为只包含对应行的。最终的 sourcemap 只有一份，它是 webpack 对 loader 生成的 sourcemap 进行简化，然后再次生成的
    plugins: [
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
});

