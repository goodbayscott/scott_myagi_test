import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import AreasState from 'state/areas';
import TeamsState from 'state/teams';
import TrainingPlansState from 'state/training-plans';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { AreaPage, Page as AreaPageContainer, UsersCollection, UserCard } from '../page';
import { AttemptStatsContainer } from 'components/common/stats';
import { CornerRemoveIcon } from 'components/common/cards';
import { ScrollableDataTable } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';
import { InviteUsersButton } from 'components/common/invites';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

let AreaPageContainerMod = TestUtils.stubRouterContext(
  AreaPageContainer,
  { areaId: '1', userId: '1' },
  { currentUser }
);
AreaPageContainerMod = TestUtils.stubAppContext(AreaPageContainerMod);

const AREA = Im.Map({
  id: 1,
  name: 'test',
  learnergroup_set: [
    {
      name: 'Test Team',
      members: []
    }
  ],
  managers: []
});

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

describe('AreaPageContainer', () => {
  beforeEach(function () {
    this.sandbox.stub(AreasState.Store, 'getItem').returns(fetch.done(AREA));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getTimeseries')
      .returns(fetch.done(Im.List()));

    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getPivotTable')
      .returns(fetch.done(Im.List()));
  });

  it('displays teams in area', () => {
    let page = TestUtils.renderIntoDocument(<AreaPageContainerMod />);

    page = TestUtils.renderIntoDocument(<AreaPageContainerMod />);

    const node = ReactDOM.findDOMNode(page);

    expect(node.innerHTML).to.contain(AREA.get('learnergroup_set')[0].name);
  });
});

describe('AreaPage', () => {
  describe('when stats button is clicked', () => {
    let page;
    let btn;
    let statsContainer;
    const area = Im.Map({
      id: 1,
      learnergroup_set: [],
      managers: []
    });
    const trainingPlans = Im.List();
    const areaAttemptTimeseries = Im.List();
    const areaAttemptStats = Im.List();
    const users = Im.List([Im.Map(fakeUser)]);

    beforeEach(function () {
      const mockStatsContainer = TestUtils.mockComponent(this.sandbox, AttemptStatsContainer);
      page = TestUtils.renderIntoDocument(<AreaPage
        area={area}
        areaAttemptTimeseries={areaAttemptTimeseries}
        areaAttemptStats={areaAttemptStats}
        currentUser={currentUser}
        users={users}
      />);
      btn = ReactTestUtils.findRenderedDOMComponentWithClass(page, 'show-stats-btn');
      ReactTestUtils.Simulate.click(btn);
      statsContainer = ReactTestUtils.findRenderedComponentWithType(page, mockStatsContainer);
    });

    it('shows area stats', () => {
      expect(statsContainer.props.show).to.equal(true);
    });
  });
});
