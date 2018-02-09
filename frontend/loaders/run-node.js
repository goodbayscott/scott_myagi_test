'use strict';
/*
  Executes node script server side. Does nothing on client.

  Usage:
    require('run-node!scripts/some-script.js');

  This will run `scripts/some-script.js` when the current script
  is processed by webpack.
*/

var exec = require('child_process').exec;

module.exports = function(content) {
  this.cacheable();
  var callback = this.async();
  exec('node ' + this.resourcePath, function(error, stdout, stderr) {
    if (stdout) console.log(stdout);
    if (error !== null) {
        return callback(error);
    } else {
      callback(null, '');
    }
  });
};

