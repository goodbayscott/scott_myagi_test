import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import TeamsState from 'state/teams';
import UsersState from 'state/users';
import TrainingPlansState from 'state/training-plans';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { TeamPage, Page as TeamPageContainer, UsersCollection, UserCard } from '../page';
import { AttemptStatsContainer } from 'components/common/stats';
import { CornerRemoveIcon } from 'components/common/cards';
import { Dropdown } from 'components/common/dropdown';
import { InviteUsersButton } from 'components/common/invites';
import { GatedFeatureBox } from 'components/common/gated-feature';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

let TeamPageContainerMod = TestUtils.stubRouterContext(
  TeamPageContainer,
  { teamId: '1', userId: '1' },
  { currentUser }
);
TeamPageContainerMod = TestUtils.stubAppContext(TeamPageContainerMod);

const fakeUser = {
  id: 1,
  first_name: 'User',
  last_name: '1',
  learner: {
    attempt_stats: {
      accuracy: 0.1
    }
  }
};

describe('TeamPageContainer', () => {
  beforeEach(function () {
    this.sandbox.stub(TeamsState.Store, 'getItem').returns(fetch.done(Im.Map()));

    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(Im.List()));

    this.sandbox.stub(TrainingPlansState.Store, 'getItems').returns(fetch.done(Im.List()));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getTimeseries')
      .returns(fetch.done(Im.List()));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getPivotTable')
      .returns(fetch.done(Im.List()));
  });

  it('displays users in team', () => {
    let page = TestUtils.renderIntoDocument(<TeamPageContainerMod />);

    TeamsState.Store.getItem.returns(fetch.done(Im.fromJS({ id: 1 })));

    UsersState.Store.getItems.returns(fetch.done(Im.List([Im.Map(fakeUser)])));

    TrainingPlansState.Store.getItems.returns(fetch.done(Im.fromJS([{ id: 1 }])));

    page = TestUtils.renderIntoDocument(<TeamPageContainerMod />);
  });

  describe('when companysettings.users_can_invite_others_to_join is True', () => {
    it('displays invite users button', () => {
      const page = TestUtils.renderIntoDocument(<TeamPageContainerMod />);

      const inviteBtn = ReactTestUtils.scryRenderedComponentsWithType(page, InviteUsersButton);
      expect(inviteBtn.length).to.equal(1);
    });

    it('still displays invite users button despite no learner permissions', () => {
      beforeEach(() => {
        const learner = currentUser.get('learner');
        learner.is_learner_group_admin = false;
        learner.is_company_admin = false;
        learner.is_training_unit_admin = false;
      });

      const page = TestUtils.renderIntoDocument(<TeamPageContainerMod />);

      const inviteBtn = ReactTestUtils.scryRenderedComponentsWithType(page, InviteUsersButton);
      expect(inviteBtn.length).to.equal(1);
    });
  });

  describe('when companysettings.users_can_invite_others_to_join is False', () => {
    beforeEach(() => {
      const learner = currentUser.get('learner');
      learner.company.companysettings.users_can_invite_others_to_join = false;
      currentUser.learner = Im.Map(learner);
    });

    it('hides invite users button', () => {
      const page = TestUtils.renderIntoDocument(<TeamPageContainerMod currentUser={currentUser} />);
      const inviteBtn = ReactTestUtils.scryRenderedComponentsWithType(page, InviteUsersButton);
      expect(inviteBtn.length).to.equal(0);
    });

    it('shows invite users button when learner is manager', () => {
      const learner = currentUser.get('learner');
      learner.is_learner_group_admin = true;
      currentUser.learner = Im.Map(learner);
      const page = TestUtils.renderIntoDocument(<TeamPageContainerMod currentUser={currentUser} />);
      const inviteBtn = ReactTestUtils.scryRenderedComponentsWithType(page, InviteUsersButton);
      expect(inviteBtn.length).to.equal(1);
    });

    it('shows invite users button when learner is admin', () => {
      const learner = currentUser.get('learner');
      learner.is_company_admin = true;
      currentUser.learner = Im.Map(learner);
      const page = TestUtils.renderIntoDocument(<TeamPageContainerMod currentUser={Im.Map(currentUser)} />);
      const inviteBtn = ReactTestUtils.scryRenderedComponentsWithType(page, InviteUsersButton);
      expect(inviteBtn.length).to.equal(1);
    });
  });
});

describe('TeamPage', () => {
  describe('when stats button is clicked', () => {
    let page;
    let btn;
    let statsContainer;
    const team = Im.Map({
      id: 1,
      stats: { series: [], stats: {} }
    });
    const users = Im.List([Im.Map(fakeUser)]);
    const trainingPlans = Im.List();
    const teamAttemptTimeseries = Im.List();
    const teamAttemptStats = Im.List();

    beforeEach(function () {
      const mockStatsContainer = TestUtils.mockComponent(this.sandbox, AttemptStatsContainer);
      page = TestUtils.renderIntoDocument(<TeamPage
        team={team}
        users={users}
        trainingPlans={trainingPlans}
        teamAttemptTimeseries={teamAttemptTimeseries}
        teamAttemptStats={teamAttemptStats}
        currentUser={currentUser}
      />);
      btn = ReactTestUtils.findRenderedDOMComponentWithClass(page, 'show-stats-btn');
      ReactTestUtils.Simulate.click(btn);
      statsContainer = ReactTestUtils.findRenderedComponentWithType(page, mockStatsContainer);
    });

    it('shows team stats', () => {
      expect(statsContainer.props.show).to.equal(true);
    });
  });

  describe('when analytics is disabled', () => {
    let page;
    let btn;
    const team = Im.Map({
      id: 1,
      stats: { series: [], stats: {} }
    });
    const users = Im.List([Im.Map(fakeUser)]);
    const trainingPlans = Im.List();
    const teamAttemptTimeseries = Im.List();
    const teamAttemptStats = Im.List();

    beforeEach(() => {
      const learner = currentUser.get('learner');
      learner.company.subscription.analytics_enabled = false;
    });

    afterEach(() => {
      const learner = currentUser.get('learner');
      learner.company.subscription.analytics_enabled = true;
    });

    it('displays GatedFeatureBox component', () => {
      page = TestUtils.renderIntoDocument(<TeamPage
        team={team}
        users={users}
        trainingPlans={trainingPlans}
        teamAttemptTimeseries={teamAttemptTimeseries}
        teamAttemptStats={teamAttemptStats}
        currentUser={currentUser}
      />);
      btn = ReactTestUtils.findRenderedDOMComponentWithClass(page, 'show-stats-btn');
      ReactTestUtils.Simulate.click(btn);
      const gatedFeatures = ReactTestUtils.scryRenderedComponentsWithType(page, GatedFeatureBox);
      expect(gatedFeatures.length).to.equal(1);
      expect(gatedFeatures[0].props.hideContent).to.be.true;
    });
  });
  describe('when analytics is enabled', () => {
    let page;
    let btn;
    const team = Im.Map({
      id: 1,
      stats: { series: [], stats: {} }
    });
    const users = Im.List([Im.Map(fakeUser)]);
    const trainingPlans = Im.List();
    const teamAttemptTimeseries = Im.List();
    const teamAttemptStats = Im.List();

    beforeEach(() => {
      const learner = currentUser.get('learner');
      learner.company.subscription.analytics_enabled = true;
    });

    it('does not display GatedFeatureBox component', () => {
      page = TestUtils.renderIntoDocument(<TeamPage
        team={team}
        users={users}
        trainingPlans={trainingPlans}
        teamAttemptTimeseries={teamAttemptTimeseries}
        teamAttemptStats={teamAttemptStats}
        currentUser={currentUser}
      />);
      btn = ReactTestUtils.findRenderedDOMComponentWithClass(page, 'show-stats-btn');
      ReactTestUtils.Simulate.click(btn);
      const gatedFeatures = ReactTestUtils.scryRenderedComponentsWithType(page, GatedFeatureBox);
      expect(gatedFeatures.length).to.equal(1);
      expect(gatedFeatures[0].props.hideContent).to.be.false;
    });
  });
});
