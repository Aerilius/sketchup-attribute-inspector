const path = require('path')
const webpack = require('webpack')
const StyleLintPlugin = require('stylelint-webpack-plugin');

module.exports = {
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
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
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
      }
    ]
  },
  resolve: {
    alias: {
    // ? extensions: ['.ts', '.js', '.vue', '.json'],
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
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
    //new VueLoaderPlugin(),
    new webpack.ProvidePlugin({
       //Vue: 'vue',
       Vue: ['vue/dist/vue.esm.js', 'default']
    }),
    //new StyleLintPlugin({
    //  files: ['**/*.{vue,htm,html,css,sss,less,scss,sass}']
    //})
  ]
}

if (process.env.NODE_ENV === 'production') {
  // https://webpack.js.org/guides/production/#source-mapping
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    // https://webpack.js.org/guides/production/#specify-the-environment
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: false//true
    })
  ])
}
