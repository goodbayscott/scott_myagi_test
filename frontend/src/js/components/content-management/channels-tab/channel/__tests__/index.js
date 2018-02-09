const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-addons-test-utils');
const Im = require('immutable');
const _ = require('lodash');

import TestUtils from 'utilities/testing';

const ChannelPage = require('../page.jsx').ChannelPage;

const currentUser = TestUtils.getMockCurrentUser();

describe('ChannelPage', () => {
  beforeEach(() => {
    TestUtils.server.create();
  });

  afterEach(() => {
    TestUtils.server.restore();
  });
});
