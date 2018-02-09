import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import TrainingPlansState from 'state/training-plans';
import ChannelsState from 'state/channels';
import TrainingSchedulesState from 'state/training-schedules';
// import PageState from '../page-state';

import { PlanCard } from '../plans-tab/plan-card';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('PlanCard', () => {
  let component,
    node,
    user = currentUser,
    learner = user.get('learner'),
    trainingPlan = Im.Map({
      name: 'TrainingPlan1',
      url: '/api/v1/training_plans/666/',
      num_enrolled_users_in_own_company: 10,
      description: 'A plan',
      owner: { url: 'company/1' },
      modules: [
        {
          name: 'Module1',
          description: 'A module',
          successfully_completed_by_current_user: true
        },
        {
          name: 'Module2',
          description: 'A module',
          successfully_completed_by_current_user: false
        }
      ],
      badges: []
    });

  beforeEach(() => {
    learner.company.user_count = 10;
    learner.company.auto_enroll_plans = ['/api/v1/training_plans/666/'];
    component = TestUtils.renderIntoDocument(<PlanCard currentUser={user} trainingPlan={trainingPlan} />);
    node = ReactDOM.findDOMNode(component);
  });

  describe('when plan company different than user company', () => {
    before(() => {
      learner.is_company_admin = true;
    });

    it('shows auto enroll item', () => {
      const items = component.getDropdownItems();
      const enrollItem = _.findWhere(items, { label: 'Enroll' });
      expect(enrollItem).to.exist;
      expect(items.length).to.equal(1);
    });

    it('does not show archive item', () => {
      const items = component.getDropdownItems();
      const archiveItem = _.findWhere(items, { label: 'Archive' });
      expect(archiveItem).to.be.undefined;
    });
  });

  describe('when plan company same was user company', () => {
    before(() => {
      learner.is_company_admin = true;
      learner.can_manage_training_content = true;
      learner.company.url = trainingPlan.get('owner').url;
    });

    it('shows the archive item', () => {
      const items = component.getDropdownItems();
      const archiveItem = _.findWhere(items, { label: 'Archive' });
      expect(archiveItem).to.exist;
    });
  });
});
