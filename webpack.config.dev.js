let path = require('path');
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ManifestPlugin = require('webpack-manifest-plugin');
let ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
let ExtractTextPlugin = require("extract-text-webpack-plugin");

let baseConfig = require('./webpack.config.base');

module.exports = Object.assign(baseConfig, {
    output: {
        filename: '[name].[hash].js',
        path: path.resolve(__dirname, 'dev')
    },

    /**
     * source map 生成模式，用webpack.SourceMapDevToolPlugin进行更加细化的操作
     * devtool有7种基本模式：
     * 1、eval                    每个模块被转化为字符串，在尾部添加//# souceURL（指明eval前文件）后，被eval包裹起来
     * 2、eval-source-map         将每个模块转化为字符串，使用eval包裹，并将打包前每个模块的sourcemap信息转换为Base64编码，拼接在每个打包后文件的结尾
     * 3、source-map              最原始的source-map实现方式，打包代码的同时生成一个sourcemap文件，并在打包文件的末尾添加//# souceURL，注释会告诉JS引擎原始文件位置
     * 4、hidden-source-map       打包结果与source-map一致，但是.map文件结尾不显示//# sourceMappingURL
     * 5、inline-source-map       为打包前的每个文件添加sourcemap的dataUrl，追加到打包后文件内容的结尾；此处，dataUrl包含一个文件完整 souremap 信息的 Base64 格式化后的字符串
     * 6、cheap-source-map        同source-map,但不包含列信息，不包含 loader 的 sourcemap
     * 7、cheap-module-source-map 不包含列信息，同时 loader 的 sourcemap 也被简化为只包含对应行的。最终的 sourcemap 只有一份，它是 webpack 对 loader 生成的 sourcemap 进行简化，然后再次生成的
     * 示例：https://github.com/webpack/webpack/tree/master/examples/source-map
     *
     * devtool模式可以看做是由eval、source-map、hidden、inline、cheap、module几个自由组合而成
     *  #eval       将模块装换成字符串(末尾会加上源码URL)，并用eval包裹起来，不会生成map文件
     *  #source-map 最原始的source-map方式，会生成map文件
     *  #hidden     不在打包后的文件末尾添加map文件URL，注意不是模块的末尾
     *  #inline     map文件base64后写在源码文件末尾
     *  #cheap      忽略列信息，不使用loader的source map
     *  #module     使用简化loader的map
     *
     */
    devtool: 'inline-source-map',//cheap-eval-source-map

    plugins: [
        /**
         * 全局开启热模块加载
         */
        new webpack.HotModuleReplacementPlugin(),
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
            filename: path.resolve('./index.dev.html')//输出路径
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

        //生成source map文件
        // new webpack.SourceMapDevToolPlugin({
        //     filename: '[name].map',
        //     exclude: /^common/    //options.test / options.include / options.exclude (string|RegExp|Array):
        // }),

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

    ],

    devServer: {
        contentBase: path.join(__dirname, "./"),//服务器内容根目录，可以是数组
        port: 9999,//端口
        compress: true,//一切服务都启用gzip 压缩
        headers: {//添加自定义头部
            "X-Custom-Foo": "bar"
        },
        hot: true,
        public:'dev.long.com'
    }
});

