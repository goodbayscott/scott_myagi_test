/*
  Add new semantic UI jquery functions when necessary.
  Install via NPM as opposed to using JS in the
  semantic folder. Only NPM installed versions are
  compatible with browserify.

  NOTE - This actually globally modifies $, so technically
  once this file is required once, all jQuery instances
  will have these functions. That said, it is
  better to explicitly require this library when needed
  so that it is clear where particular jQuery functions
  are coming from.
*/

var $ = require('jquery');


// var transition = require('semantic-ui-transition');
// // This hack is a way to solve the issue raised here: https://github.com/Semantic-Org/Semantic-UI/issues/1878
// // without having to modifiy Semantic-UI directly. It's pretty bad, so look to upgrade semantic-ui-transition
// // once it is solved for real.
// window._module = {exports: {settings: transition.settings}};
$.fn.transition = require('semantic-ui-transition');
$.fn.dropdown = require('semantic-ui-dropdown');
$.fn.dimmer = require('semantic-ui-dimmer');
$.fn.modal = require('semantic-ui-modal');
$.fn.popup = require('semantic-ui-popup');
$.fn.progress = require('semantic-ui-progress');

module.exports = $;
