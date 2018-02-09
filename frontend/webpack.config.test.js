const merge = require('webpack-merge');
const BundleTracker = require('webpack-bundle-tracker');

const common = require('./webpack.config');

module.exports = merge(common, {
  devtool: 'eval', // Tests run faster without sourcemaps

  plugins: [new BundleTracker({ filename: './webpack-stats.test.json' })],
});
