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
import PageState from '../page-state';

import { Page as PageContainer, TrainingPlansTabContent, EnrollDropdown } from '../page';
import { TrainingPlanCard, TrainingPlansCollection } from '../plan-card';
import { TrainingPlanCardDetails } from '../plan-card/card';
import { Dropdown } from 'components/common/dropdown';
import { DropdownFilterSet } from 'components/common/filter-set';
import { CreatePlanModal } from '../create-plan-modal';
import { ViewTrainingPlanModal } from '../plan-modal';
import { CornerDropdown } from 'components/common/cards';
import { ProgressBar } from 'components/common/progress-bar';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('PageContainer', () => {
  let component,
    node,
    trainingPlansStoreGetItemsSpy,
    channelsStoreGetItemsSpy,
    transitionSpy = sinon.spy(),
    user = currentUser,
    filter,
    search,
    trainingPlans,
    learner = _.extend({}, currentUser.get('learner'));
  user = user.set('learner', learner);

  beforeEach(function () {
    filter = {
      foo: 'bar'
    };

    search = 'hello';

    trainingPlans = Im.List([
      Im.Map({
        name: 'TrainingPlan1'
      })
    ]);

    this.sandbox.stub(PageState.Store, 'getCurrentFilterQuery').returns(filter);

    this.sandbox.stub(PageState.Store, 'getTrainingPlanSearch').returns(search);

    trainingPlansStoreGetItemsSpy = this.sandbox.spy(TrainingPlansState.Store, 'getItems');
    channelsStoreGetItemsSpy = this.sandbox.spy(ChannelsState.Store, 'getItems');

    const PageContainerWithContext = TestUtils.stubAppContext(PageContainer, undefined, {
      router: { push: transitionSpy },
      currentUser: user
    });
    component = TestUtils.renderIntoDocument(<PageContainerWithContext currentUser={user} />);

    node = ReactDOM.findDOMNode(component);
  });

  it('fetches plans with correct filter and search options', () => {
    const args = trainingPlansStoreGetItemsSpy.lastCall.args;
    const query = args[0];
    expect(query.search).to.equal(search);
    expect(query.foo).to.equal(filter.foo);
  });

  describe('when user has no company', () => {
    before(() => {
      delete learner.company;
      user = user.set('learner', learner);
    });

    it('redirects to join-or-create-company page', () => {
      expect(transitionSpy.called).to.be.true;
    });
  });
});

describe('TrainingPlanCard', () => {
  let component,
    node,
    user = currentUser,
    trainingPlan = Im.Map({
      name: 'TrainingPlan1',
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
    component = TestUtils.renderIntoDocument(<TrainingPlanCard currentUser={user} trainingPlan={trainingPlan} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('correctly calculates progress percentage', () => {
    const progressBar = ReactTestUtils.findRenderedComponentWithType(component, ProgressBar);
    expect(progressBar.props.total).to.equal(2);
    expect(progressBar.props.completed).to.equal(1);
  });

  describe('when user permissions change', () => {
    let learner = _.extend({ company: { url: 'company/2' } }, user.get('learner')),
      viewItem,
      StartItem,
      enrollItem,
      editItem;

    user = user.set('learner', learner);

    beforeEach(() => {
      const details = ReactTestUtils.scryRenderedComponentsWithType(
        component,
        TrainingPlanCardDetails
      )[0];
      const items = details.props.dropDownItems;
      viewItem = _.findWhere(items, { label: 'view' });
      StartItem = _.findWhere(items, { label: 'start' });
      enrollItem = _.findWhere(items, { label: 'enroll' });
      editItem = _.findWhere(items, { label: 'edit' });
      node = ReactDOM.findDOMNode(component);
    });

    // describe('when user has no explicit permissions', () => {
    //   it('allows user to "Continue" the plan', () => {
    //     expect(StartItem).to.exist;
    //   });

    //   it('does not allow user to "Enroll" others in the plan', () => {
    //     expect(enrollItem).to.not.exist;
    //   });
    // });

    // describe('when user has the `can_enroll_others_in_training_content` permission', () => {
    //   before(() => {
    //     learner.can_enroll_others_in_training_content = true;
    //   });
    //
    //   it('allows the user to "Enroll" others in the plan', () => {
    //     expect(enrollItem).to.exist;
    //   });
    // });

    describe('when user has the `can_manage_training_content` permission', () => {
      before(() => {
        learner.can_manage_training_content = true;
      });

      describe("when the plan is owned by the user's company", () => {
        before(() => {
          learner.company.url = trainingPlan.get('owner').url;
        });
      });
    });
  });
});

describe('CreatePlanModal', () => {
  let component;
  let node;
  const user = currentUser;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<CreatePlanModal currentUser={user} />);
    node = ReactDOM.findDOMNode(component);
  });

  afterEach(done => {
    _.defer(() => {
      // TODO: Cannot access the component to cleanup the modal,
      // so will just comment this out for now.
      // component.refs.modal.refs.detailsModal.cleanup();
      done();
    });
  });

  it('renders `ViewTrainingPlanModal` on submit', () => {
    let modal = ReactTestUtils.scryRenderedComponentsWithType(component, ViewTrainingPlanModal)[0];
    expect(modal).not.to.exist;
    component.onSubmit({
      body: {
        id: 1,
        url: 'training_plans/1',
        name: 'Plan 1',
        description: 'A new plan',
        owner: {
          url: 'company/1'
        },
        modules: []
      }
    });
    modal = ReactTestUtils.scryRenderedComponentsWithType(component, ViewTrainingPlanModal)[0];

    expect(modal).to.exist;
  });
});
