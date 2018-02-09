import sinon from 'sinon';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import { fetch } from 'marty';
import { resolve } from 'react-router-named-routes';

import TestUtils from 'utilities/testing';

import UsersState from 'state/users';
import TrainingSchedulesState from 'state/training-schedules';

import { EnrollmentsPage, UsersCollection, UserCard } from '../page';
import { Card } from 'components/common/cards';
import { EnrollModal, SelectTrainingPlansModal, SelectUsersModal } from '../enroll-modal';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('EnrollmentsPage', () => {
  it('passes users to `UsersCollection`', function () {
    const users = Im.List([
      Im.Map({
        id: 1,
        first_name: 'User',
        last_name: '1',
        email: 'User1',
        learner: {}
      })
    ]);
    let passedCount = 0;
    const userCollectionMock = TestUtils.mockComponent(this.sandbox, UsersCollection, {
      componentWillMount() {
        passedCount = this.props.users.count();
      }
    });
    let page = TestUtils.renderIntoDocument(<EnrollmentsPage />);
    expect(passedCount).to.equal(0);
    page = TestUtils.renderIntoDocument(<EnrollmentsPage users={users} isLoading={_.noop} moreAvailable={_.noop} loadMore={_.noop} />);
    expect(passedCount).to.equal(users.count());
  });
});

describe('UserCard', () => {
  it("display's user name", () => {
    const user = Im.Map({
      id: 1,
      first_name: 'User',
      last_name: '1',
      learner: { profile_photo: '123', learnergroup_name: 'team' }
    });
    const card = TestUtils.renderIntoDocument(<UserCard user={user} />);
    const html = ReactDOM.findDOMNode(card).innerHTML;
    expect(html).to.contain(`${user.get('first_name')}`);
  });
});

describe('EnrollModal', () => {
  it('submits new enrollment data from sub-modals', function () {
    const tp = 'training_plan/1';
    const learner = 'learner/1';
    let submittedData;
    let listRoute;
    const EnrollModalMod = TestUtils.stubAppContext(EnrollModal);
    TestUtils.mockComponent(this.sandbox, SelectUsersModal, {
      show: _.noop,
      hide: _.noop
    });
    this.sandbox
      .stub(TrainingSchedulesState.ActionCreators, 'doListAction')
      .callsFake((route, data) => {
        listRoute = route;
        submittedData = data;
      });
    const modal = TestUtils.renderIntoDocument(<EnrollModalMod currentUser={currentUser} />);
    modal.getInnerComponent().onFirstSubmitAndValid({
      trainingPlanURLs: [tp]
    });
    modal.getInnerComponent().onSecondSubmitAndValid({
      due_date: moment(),
      learners: [learner]
    });
    expect(listRoute).to.equal('bulk_create');
    expect(submittedData.training_plans[0]).to.equal(tp);
    expect(submittedData.learners[0]).to.equal(learner);
  });
});
