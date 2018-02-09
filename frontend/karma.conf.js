const webpackConfig = require('./webpack.config.test');

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    // basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'], // use the mocha test framework

    client: {
      captureConsole: true,
      mocha: {
        reporter: 'html', // change Karma's debug.html to the mocha web reporter
        ui: 'bdd',
      },
    },

    // list of files / patterns to load in the browser
    files: ['test-loader.js'],

    preprocessors: {
      'test-loader.js': ['webpack', 'sourcemap'],
    },

    webpackMiddleware: {
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

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    logLevel: config.LOG_ERROR, // LOG_DISABLE LOG_ERROR LOG_WARN LOG_INFO LOG_DEBUG

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['Chrome', 'Firefox', 'PhantomJS'],
    browsers: ['Chrome', 'ChromeHeadless', 'ChromeHeadlessCustom'],

    customLaunchers: {
      ChromeHeadlessCustom: {
        base: 'ChromeHeadless',
        flags: ['--disable-web-security', '--allow-file-access-from-files'],
      },
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    webpack: webpackConfig,

    captureTimeout: 60000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 10,
    browserNoActivityTimeout: 60000,
  });
};
