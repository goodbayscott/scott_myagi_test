'use strict';

const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ValidateI18nPlugin = require('./plugins/webpack-validate-i18n');
const webpack = require('webpack');
const BundleTracker = require('webpack-bundle-tracker');
const HappyPack = require('happypack');
const packageDetails = require('./package.json');
const _ = require('lodash');

const NODE_ENV = process.env.NODE_ENV || 'development';

// Some packages break down if
// placed in the vendor bundle
const NOT_VENDOR = [
  'browsernizr',
  'isomorphic-fetch',
  'react-cropper',
  'semantic-ui',
  'react-youtube',
  'plotly.js'
];

const OTHER_VENDOR = ['vendor/vimeo'];

const getVendor = () => {
  let vendor = _.keys(packageDetails.dependencies);
  vendor = _.filter(vendor, p => !_.contains(NOT_VENDOR, p));
  vendor.concat(OTHER_VENDOR);
  return vendor;
};

module.exports = {
  entry: {
    app: ['babel-polyfill', 'whatwg-fetch', './src/js/main'],
    vendor: getVendor()
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: './js/[name].[hash].js',
    chunkFilename: './js/[name].[hash].js'
  },

  resolve: {
    // This is required so that symlinked modules have their dependencies resolved within
    // the frontend directory and not the location they point to.
    symlinks: false,
    modules: [
      path.resolve(__dirname, './src'),
      path.resolve(__dirname, './src/js'),
      path.resolve(__dirname, './src/js/common'),
      'node_modules'
    ],
    extensions: ['.js', '.jsx']
  },

  plugins: [
    new HappyPack({
      id: 'jsx',
      threads: 4,
      verbose: true,
      loaders: [
        {
          loader: 'babel-loader',
          query: {
            cacheDirectory: true,
            presets: ['react', ['es2015', { modules: false }], 'stage-0'],
            plugins: ['transform-decorators-legacy', 'transform-object-assign']
          }
        }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: `"${NODE_ENV}"`
      }
    }),
    new ExtractTextPlugin({ filename: 'css/bundle.[hash].css' }),
    new BundleTracker({ filename: './webpack-stats.json' }),
    new webpack.NoEmitOnErrorsPlugin(),
    // Necessary for wysiwyg image resize plugin for quill editor
    // https://github.com/kensnyder/quill-image-resize-module/issues/7#issuecomment-304463415
    new webpack.ProvidePlugin({
      'window.Quill': 'quill/dist/quill.js',
      Quill: 'quill/dist/quill.js'
    })
  ],

  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|wav|ico)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: `${NODE_ENV == 'production' ? '/img/' : ''}[name].[ext]?[hash]`
            }
          }
        ]
      },
      {
        test: /\.json$/,
        use: [{ loader: 'json-loader' }]
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve(`${__dirname}/src`),
          path.resolve(`${__dirname}/src/js/common`),
          // Include modules installed from github here if necessary
          path.resolve(`${__dirname}/node_modules/react-flipcard`)
        ],
        use: [
          {
            loader: 'happypack/loader',
            options: { id: 'jsx' }
          }
        ]
      },
      {
        test: /\.pdf(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              minetype: 'application/pdf',
              name: '[name].pdf'
            }
          }
        ]
      }
    ]
  }
};
