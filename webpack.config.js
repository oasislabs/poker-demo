const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const truffleConfig = require('./truffle-config.js')
const pages = fs.readdirSync('./src/pages').filter(name => !name.startsWith('.'))

module.exports = function (web3, network, artifacts, confidential) {
  let networkConfig = truffleConfig.config[network]

  try {
    var contract = artifacts.require('GameServerContract')
    var address = contract.address
  } catch (err) {
    console.warn('Warning: No network deployment was detected, so only building singleplayer mode.')
  }

  let entry = !contract ? { singleplayer : './src/pages/singleplayer/index.js' } : pages.reduce((acc, page) => {
    acc[page] = `./src/pages/${page}/index.js`;
    return acc;
  }, {})

  return {
    entry,
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader?retainLines=true']
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [ 'style-loader', 'css-loader' ]
        },
        {
         test: /\.(svg|png|jpg|gif)$/,
         use: [
           {
             loader: 'file-loader',
             options: {
               name: '[name].[ext]'
             }
           }
         ]
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx']
    },
    output: {
      path: __dirname + '/dist',
      publicPath: './',
      filename: '[name].bundle.js'
    },
    plugins: [
      new webpack.DefinePlugin({
        'CONTRACT_ADDRESS':  JSON.stringify(address || ''),
        'WS_ENDPOINT': JSON.stringify(networkConfig.wsEndpoint),
        'CONFIDENTIAL_CONTRACT': confidential
      }),
      new webpack.HotModuleReplacementPlugin(),
      ...pages.map(page => new HtmlWebpackPlugin({
        filename: `${page}.html`,
        chunks: [ page ],
        template: './src/template.html'
      })),
      new webpack.LoaderOptionsPlugin({
        debug: true
      }),
      new HtmlWebpackPlugin({
        title: 'Oasis Game'
      }),
      new webpack.NormalModuleReplacementPlugin(/env/, function(resource) {
	if (resource.request === 'env') {
	  resource.request = '../wasm32-shim'
	}
      })
    ],
    devtool: 'cheap-eval-source-map',
    devServer: {
      contentBase: './dist',
      hot: true
    }
  }
};
