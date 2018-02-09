import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { TitleControllerInner } from '../title-controller';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('TitleControllerInner', () => {
  const MESSAGES_COUNT = 3;
  beforeEach(function () {
    this.component = TestUtils.renderIntoDocument(<TitleControllerInner newMessagesCount={MESSAGES_COUNT} />);

    this.node = ReactDOM.findDOMNode(this.component);
  });

  it('displays new messages count', () => {
    expect(document.title).to.contain(`(${MESSAGES_COUNT})`);
  });
});
