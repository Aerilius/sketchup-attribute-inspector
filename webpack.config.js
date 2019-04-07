const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const StyleLintPlugin = require('stylelint-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './dialogs/main.js',
  output: {
    path: path.resolve(__dirname, './src/ae_attribute_inspector/js/'),
    publicPath: '', // Assumes HTML sets <base> with href to the `ui` directory.
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          //include: [resolve('src'), resolve('test'), resolve('node_modules/vue2-collapse')]
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '../images/[name].[ext]',
          // emitFile: false
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }/*,
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            // global data for all components
            // this can be read from a scss file
            options: {
              data: '$color: red;'
            }
          }
        ]
      }*/
    ]
  },
  /*resolve: {
    alias: {
    // ? extensions: ['.ts', '.js', '.vue', '.json'],
      'vue$': 'vue/dist/vue.esm.js'
    }
  },*/
  devServer: {
    historyApiFallback: {
      index: 'src/ae_attribute_inspector/html/app.html'
    },
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    // make sure to include the plugin
    new webpack.ProvidePlugin({
       //Vue: 'vue',
       Vue: ['vue/dist/vue.esm.js', 'default']
    }),
    new VueLoaderPlugin(),
    //new StyleLintPlugin({
    //  files: ['**/*.{vue,htm,html,css,sss,less,scss,sass}']
    //})
  ]
}

if (process.env.NODE_ENV === 'production') {
  module.exports.mode = 'production'
  // https://webpack.js.org/guides/production/#source-mapping
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    // https://webpack.js.org/guides/production/#specify-the-environment
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ])
  module.exports.optimization = Object.assign({}, module.exports.optimization, {
    minimize: true,
    moduleIds: 'named',
    chunkIds: 'named'
  });
}
