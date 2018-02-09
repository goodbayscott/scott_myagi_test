const webpack = require('webpack');
const merge = require('webpack-merge');

const common = require('./webpack.config');

const baseURL = process.env.SERVER_URL || 'http://localhost';
const baseURLWithPort = `${baseURL}:8888`;

module.exports = merge(common, {
  entry: {
    devServer: `webpack-dev-server/client?${baseURLWithPort}`,
  },

  devServer: {
    contentBase: './dist/',
    hot: true,
    noInfo: false,
    port: 8888,
    host: '0.0.0.0',
    proxy: {
      '/api/*': 'http://localhost:8000',
    },
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: {
      hash: false,
      version: false,
      timings: true,
      assets: false,
      chunks: false,
      modules: false,
      reasons: false,
      children: false,
      source: false,
      errors: true,
      errorDetails: true,
      warnings: true,
      publicPath: false,
    },
  },

  output: {
    // Django knows to use this to retrieve the static files
    publicPath: `${baseURLWithPort}/dist`,
  },

  // devtool: 'source-map',
  devtool: 'eval',

  plugins: [
    // Note: these plugins can't be used with karma
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: './js/vendor.[hash].js',
      minChunks: Infinity,
    }),
    new webpack.IgnorePlugin(/__tests__/),
  ],
});
