import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import EnrollmentGroupsState from 'state/enrollment-groups';
import TeamsState from 'state/teams';
import UsersState from 'state/users';
import TrainingPlansState from 'state/training-plans';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import {
  EnrollmentGroupPage,
  Page as EnrollmentGroupPageContainer,
  UsersCollection,
  UserCard
} from '../page';
import { AttemptStatsContainer } from 'components/common/stats';
import { CornerRemoveIcon } from 'components/common/cards';
import { Dropdown } from 'components/common/dropdown';
import { InviteUsersButton } from 'components/common/invites';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();
currentUser.get('learner').profile_photo = '/static/profile.jpg';
currentUser.get('learner').learner_group = 'learner_group/1';
const fakeUser = Im.Map({
  id: 1,
  first_name: 'UserFirstName',
  last_name: '1',
  url: 'user/1',
  learner: {
    attempt_stats: {
      accuracy: 0.1
    }
  }
});

const ENROLLMENT_GROUP = Im.Map({
  id: 1,
  name: 'test',
  url: 'enrollment_group/1',
  members: [fakeUser]
});

const VIEWABLE_MEMBERS = Im.List([fakeUser]);

describe.skip('EnrollmentGroupPageContainer', () => {
  let EnrollmentGroupPageContainerMod,
    page;
  beforeEach(function () {
    this.sandbox.stub(EnrollmentGroupsState.Store, 'getItem').returns(fetch.done(ENROLLMENT_GROUP));

    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(VIEWABLE_MEMBERS));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getTimeseries')
      .returns(fetch.done(Im.List()));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getPivotTable')
      .returns(fetch.done(Im.List()));
  });

  it('displays members in enrollment group', () => {
    EnrollmentGroupPageContainerMod = TestUtils.stubRouterContext(
      EnrollmentGroupPageContainer,
      { enrollmentGroupId: '1', userId: '1' },
      { currentUser }
    );
    EnrollmentGroupPageContainerMod = TestUtils.stubAppContext(EnrollmentGroupPageContainerMod);

    page = TestUtils.renderIntoDocument(<EnrollmentGroupPageContainerMod />);

    page = TestUtils.renderIntoDocument(<EnrollmentGroupPageContainerMod />);

    const node = ReactDOM.findDOMNode(page);

    expect(node.innerHTML).to.contain(VIEWABLE_MEMBERS.first().get('first_name'));
  });

  describe('When user is a company admin', () => {
    beforeEach(() => {
      currentUser.get('learner').is_company_admin = true;
      EnrollmentGroupPageContainerMod = TestUtils.stubRouterContext(
        EnrollmentGroupPageContainer,
        { enrollmentGroupId: '1', userId: '1' },
        { currentUser }
      );
      EnrollmentGroupPageContainerMod = TestUtils.stubAppContext(EnrollmentGroupPageContainerMod);
    });
    it('displays edit enrollment group details button', () => {
      page = TestUtils.renderIntoDocument(<EnrollmentGroupPageContainerMod />);
      const node = ReactDOM.findDOMNode(page);
      expect(node.innerHTML).to.contain('Edit details');
      expect(node.innerHTML).not.to.contain('View details');
    });
  });

  describe('When user is not a company admin', () => {
    beforeEach(() => {
      currentUser.get('learner').is_company_admin = false;
      currentUser.get('learner').is_learner_group_admin = true;
      EnrollmentGroupPageContainerMod = TestUtils.stubRouterContext(
        EnrollmentGroupPageContainer,
        { enrollmentGroupId: '1', userId: '1' },
        { currentUser }
      );
      EnrollmentGroupPageContainerMod = TestUtils.stubAppContext(EnrollmentGroupPageContainerMod);
    });
    it('does not display edit enrollment group details button', () => {
      page = TestUtils.renderIntoDocument(<EnrollmentGroupPageContainerMod />);
      const node = ReactDOM.findDOMNode(page);
      expect(node.innerHTML).to.contain('View details');
      expect(node.innerHTML).not.to.contain('Edit details');
    });
  });
});

describe.skip('EnrollmentGroupPage', () => {
  describe('when stats button is clicked', () => {
    let page;
    let btn;
    let statsContainer;
    const enrollmentGroup = ENROLLMENT_GROUP;
    const trainingPlans = Im.List();
    const enrollmentGroupAttemptTimeseries = Im.List();
    const enrollmentGroupAttemptStats = Im.List();
    const users = Im.List([Im.Map(fakeUser)]);

    beforeEach(function () {
      const mockStatsContainer = TestUtils.mockComponent(this.sandbox, AttemptStatsContainer);
      let EnrollmentGroupPageMod = TestUtils.stubRouterContext(
        EnrollmentGroupPage,
        { enrollmentGroupId: '1', userId: '1' },
        { currentUser }
      );
      EnrollmentGroupPageMod = TestUtils.stubAppContext(EnrollmentGroupPageMod);
      page = TestUtils.renderIntoDocument(<EnrollmentGroupPageMod
        enrollmentGroup={enrollmentGroup}
        enrollmentGroupAttemptTimeseries={enrollmentGroupAttemptTimeseries}
        enrollmentGroupAttemptStats={enrollmentGroupAttemptStats}
        currentUser={currentUser}
        viewableMembers={VIEWABLE_MEMBERS}
        users={users}
      />);
      btn = ReactTestUtils.findRenderedDOMComponentWithClass(page, 'show-stats-btn');
      ReactTestUtils.Simulate.click(btn);
      statsContainer = ReactTestUtils.findRenderedComponentWithType(page, mockStatsContainer);
    });

    it('shows enrollment group stats', () => {
      expect(statsContainer.props.show).to.equal(true);
    });
  });
});
