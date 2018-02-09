import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import sinon from 'sinon';
import moment from 'moment-timezone';

import TestUtils from 'utilities/testing';
import { TrainingPlansCollection } from '../index';
import { TrainingPlanCardDetails } from '../card';
import { Card } from 'components/common/cards';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('TrainingPlansCollection', () => {
  let component,
    node,
    createCard = () => <Card />,
    loadMore = sinon.spy(),
    moreAvailable = sinon.spy(),
    isLoading = sinon.spy(),
    trainingPlans = Im.List([
      Im.Map({
        name: 'TrainingPlan1'
      })
    ]);

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<TrainingPlansCollection
      trainingPlans={trainingPlans}
      createCard={createCard}
      loadMore={loadMore}
      moreAvailable={moreAvailable}
      isLoading={isLoading}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('renders cards', () => {
    const cards = ReactTestUtils.scryRenderedComponentsWithType(component, Card);
    expect(cards).to.have.length(trainingPlans.count());
  });
});

describe('TrainingPlanCardDetails', () => {
  let component,
    trainingPlan,
    progress = 75,
    autoEnrollPlans = [],
    node;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<TrainingPlanCardDetails
      trainingPlan={trainingPlan}
      currentUser={currentUser}
      completedModulesCount={1}
      dropDownItems={[]}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  describe('when plan is in company auto enroll set', () => {
    before(() => {
      autoEnrollPlans = ['/api/v1/training_plans/4168/'];
      trainingPlan = Im.Map({
        url: '/api/v1/training_plans/4168/',
        thumbnail_url: 'thumb.jpg',
        badges: [
          {
            id: 1,
            name: 'Badge name',
            badge_image: ''
          }
        ],
        modules: [{}],
        owner: {},
        next_due_date_for_user: null,
        is_published: true,
        user_is_enrolled: true,
        auto_enroll: false,
        num_enrolled_users: 95
      });
      currentUser.get('learner').is_company_admin = true;
      currentUser.get('learner').company.company_type = 'retailer';
    });

    it('indicates Auto Enroll On', () => {
      const icon = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'ui icon student');
      console.log(icon);
      expect(icon).to.be.not.undefined;
    });
  });

  describe('when user is admin', () => {
    before(() => {
      autoEnrollPlans = [];
      trainingPlan = Im.Map({
        url: '/api/v1/training_plans/4168/',
        thumbnail_url: 'thumb.jpg',
        badges: [
          {
            id: 1,
            name: 'Badge name',
            badge_image: ''
          }
        ],
        modules: [{}],
        owner: {},
        next_due_date_for_user: null,
        is_published: true,
        user_is_enrolled: false,
        auto_enroll: false,
        num_enrolled_users: 99
      });
      currentUser.get('learner').is_company_admin = true;
      currentUser.get('learner').company.company_type = 'retailer';
    });

    it('displays company enrollment percentage', () => {
      expect(node.innerHTML).to.contain('100%');
    });
  });

  describe('when company_type is brand', () => {
    before(() => {
      autoEnrollPlans = ['/api/v1/training_plans/4168/'];
      trainingPlan = Im.Map({
        url: '/api/v1/training_plans/4168/',
        thumbnail_url: 'thumb.jpg',
        badges: [
          {
            id: 1,
            name: 'Badge name',
            badge_image: ''
          }
        ],
        modules: [{}],
        owner: {},
        next_due_date_for_user: null,
        is_published: true,
        user_is_enrolled: true,
        auto_enroll: false,
        num_enrolled_users: 99
      });
      currentUser.get('learner').is_company_admin = true;
      currentUser.get('learner').company.company_type = 'brand';
    });
  });

  describe('when user is not admin', () => {
    before(() => {
      autoEnrollPlans = ['/api/v1/training_plans/4168/'];
      trainingPlan = Im.Map({
        url: '/api/v1/training_plans/4168/',
        thumbnail_url: 'thumb.jpg',
        badges: [
          {
            id: 1,
            name: 'Badge name',
            badge_image: ''
          }
        ],
        modules: [{}],
        owner: {},
        next_due_date_for_user: null,
        is_published: true,
        user_is_enrolled: true,
        auto_enroll: false,
        num_enrolled_users: 99
      });
      currentUser.get('learner').is_company_admin = false;
    });
  });

  describe('when plan has a due date', () => {
    before(() => {
      autoEnrollPlans = ['/api/v1/training_plans/4168/'];
      trainingPlan = Im.Map({
        url: '/api/v1/training_plans/4168/',
        thumbnail_url: 'thumb.jpg',
        badges: [
          {
            id: 1,
            name: 'Badge name',
            badge_image: ''
          }
        ],
        modules: [{}],
        owner: {},
        next_due_date_for_user: moment(),
        is_published: true,
        user_is_enrolled: true,
        auto_enroll: false,
        num_enrolled_users: 99
      });
      currentUser.get('learner').is_company_admin = false;
    });

    it('displays due date from now', () => {
      expect(node.innerHTML).to.contain('due-clock');
    });
  });
});
