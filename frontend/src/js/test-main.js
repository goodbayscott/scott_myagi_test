import Radium from 'radium';

const sinon = require('sinon');

import { configureForLocale } from 'i18n';

import TestUtils from 'utilities/testing';
import { getAll } from 'state/common/generators/http-api';
import YouTubeIframeLoader from 'youtube-iframe';

const SUPPRESS_CONSOLE = true;

beforeEach(function () {
  if (SUPPRESS_CONSOLE) TestUtils.suppressConsole();

  configureForLocale('en');

  // These modules are loaded globally in the
  // 'views.html' template so we need to mock them
  // here
  TestUtils.mockWaffle();
  TestUtils.mockAnalytics();

  this.sandbox = sinon.sandbox.create();

  // Fix for issues relating to YouTubeIframe
  this.sandbox.stub(YouTubeIframeLoader, 'load').yields({
    Player: this.sandbox.stub().returns({
      addEventListener: this.sandbox.stub(),
      removeEventListener: this.sandbox.stub(),
      destroy: this.sandbox.stub
    })
  });

  // Clear all store data
  const stateObjs = getAll();
  stateObjs.forEach(state => state.Store.resetState());
  // Make sure all components which were mounted are unmounted.
  // This ensures test isolation.
  TestUtils.unmountAll();

  window.oldOnBeforeUnload = window.onbeforeunload;
  window.onbeforeunload = () => {};

  // Tested components aren't wrapped in the StyleRoot component, this turns
  // error into warning for tests, so we don't need to wrap anything in <StyleRoot/>
  Radium.TestMode.enable();
});

afterEach(function () {
  this.sandbox.restore();

  // window.onbeforeunload = window.oldOnBeforeUnload;
  // window.oldOnBeforeUnload = () => {};
  if (SUPPRESS_CONSOLE) TestUtils.outputConsoleSuppressionStats();
});

after(() => {
  // Magic string which run-headless-chromium looks for
  console.info('All tests completed!');
});
