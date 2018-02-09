import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { StatsBox } from '../stats-box';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('StatsBox', () => {
  let component,
    node,
    user = currentUser,
    learner = currentUser.get('learner');

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<StatsBox currentUser={user} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays badge list', () => {
    expect(node.innerHTML).to.contain(user.get('badge_awards')[0].badge.badge_image);
  });

  it('displays average score', () => {
    expect(node.innerHTML).to.contain(learner.average_percentage_score.toString());
  });

  it('displays number of completed modules', () => {
    expect(node.innerHTML).to.contain(learner.num_modules_completed.toString());
  });

  it('displays team rank', () => {
    expect(node.innerHTML).to.contain(learner.learnergroup_rank);
  });
});
