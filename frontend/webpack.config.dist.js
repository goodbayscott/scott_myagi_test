const _ = require('lodash');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ValidateI18nPlugin = require('./plugins/webpack-validate-i18n');

const enLocale = require('./src/js/common/locale/en.json');

const common = require('./webpack.config');

module.exports = merge(common, {
  devtool: 'source-map',

  plugins: [
    new ValidateI18nPlugin({
      baseLocaleData: enLocale,
      paths: ['src/**/*.js', 'src/**/*.jsx'],
      functionMarker: 't',
      // outputResults: './tmp/i18n-validation.json',
      outputMissing: './tmp/i18n-missing-keys.json',
      throwError: true
    }),
    new CleanWebpackPlugin(['dist'], {
      root: __dirname,
      verbose: true,
      dry: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        warnings: false
      },
      uglifyOptions: {
        // These options taken from https://slack.engineering/keep-webpack-fast-a-field-guide-for-better-build-performance-f56a5995e8f1.
        compress: {
          arrows: false,
          booleans: false,
          cascade: false,
          collapse_vars: false,
          comparisons: false,
          computed_props: false,
          hoist_funs: false,
          hoist_props: false,
          hoist_vars: false,
          if_return: false,
          inline: false,
          join_vars: false,
          keep_infinity: true,
          loops: false,
          negate_iife: false,
          properties: false,
          reduce_funcs: false,
          reduce_vars: false,
          sequences: false,
          side_effects: false,
          switches: false,
          top_retain: false,
          toplevel: false,
          typeofs: false,
          unused: false,

          // Switch off all types of compression except those needed to convince
          // react-devtools that we're using a production build
          conditionals: true,
          dead_code: true,
          evaluate: true
        }
      },
      output: {
        comments: false
      },
      mangle: true,
      parallel: true
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: './js/vendor.[hash].js',
      minChunks: Infinity
    }),
    new webpack.IgnorePlugin(/__tests__/)
  ]
});
