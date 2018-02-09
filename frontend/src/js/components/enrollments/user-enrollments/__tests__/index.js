import sinon from 'sinon';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import { fetch } from 'marty';

import TestUtils from 'utilities/testing';

import UsersState from 'state/users';
import TrainingSchedulesState from 'state/training-schedules';

// import {EnrollmentCard, Page as UserEnrollmentsContainer, UserEnrollmentsPage} from '../page';
import { EnrollmentsCollection } from '../page';
import { Page as UserEnrollmentsPage } from '../page';
import { EnrollWithSelectedUsersModal } from 'components/enrollments/enroll-modal';
import { ScrollableDataTable, TableRow } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('EnrollmentsCollection', () => {
  let enrollments,
    component,
    node;

  beforeEach(() => {
    enrollments = Im.List([
      Im.Map({
        id: 1,
        plan_due_date: null,
        completed: false,
        completed_date: null,
        training_plan: {
          thumbnail_url: 'the/image',
          name: 'a plan'
        }
      })
    ]);

    const EnrollmentsCollectionMod = TestUtils.stubRouterContext(EnrollmentsCollection, {}, {});
    component = TestUtils.renderIntoDocument(<EnrollmentsCollectionMod
      user={currentUser}
      enrollments={enrollments}
      isLoading={_.noop}
      moreAvailable={_.noop}
      loadMore={_.noop}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays enrollments for a user', () => {
    const rows = ReactTestUtils.scryRenderedComponentsWithType(component, TableRow);
    expect(rows).length.to.be(1);
  });

  it('displays the remove user dropdown menu', () => {
    const dropdown = ReactTestUtils.scryRenderedComponentsWithType(component, Dropdown);
    expect(dropdown).length.to.be(1);
    expect(node.innerHTML).to.contain('Remove');
  });

  it('shows that traiing plan is not yet completed', () => {
    expect(node.innerHTML).to.contain('Not completed');
    expect(node.innerHTML).to.not.contain('Completed on');
  });

  describe('when completed is true', () => {
    beforeEach(() => {
      enrollments = Im.List([
        Im.Map({
          id: 1,
          plan_due_date: null,
          completed: true,
          completed_date: '2015-04-02T06:07:51.739916Z',
          training_plan: {
            thumbnail_url: 'the/image',
            name: 'a plan'
          }
        })
      ]);

      const EnrollmentsCollectionMod = TestUtils.stubRouterContext(EnrollmentsCollection, {}, {});
      component = TestUtils.renderIntoDocument(<EnrollmentsCollectionMod
        user={currentUser}
        enrollments={enrollments}
        isLoading={_.noop}
        moreAvailable={_.noop}
        loadMore={_.noop}
      />);

      node = ReactDOM.findDOMNode(component);
    });

    it('displays completed date', () => {
      expect(node.innerHTML).to.contain('Completed on');
      expect(node.innerHTML).to.not.contain('Not completed');
    });
  });
});

describe('UserEnrollmentsPage', () => {
  let enrollments,
    component,
    enrollUsersModalSpy = sinon.spy(),
    node,
    sandbox,
    EnrollWithSelectedUsersModalMock,
    UserEnrollmentsPageMod;

  beforeEach(function () {
    enrollments = Im.List([
      Im.Map({
        id: 1,
        plan_due_date: '2015-04-02T06:07:51.739916Z',
        completed: false,
        completed_date: null,
        training_plan: {
          thumbnail_url: 'https://img.youtube.com/vi/xa1XSWvhtm4/0.jpg',
          name: 'a plan'
        }
      })
    ]);

    EnrollWithSelectedUsersModalMock = TestUtils.mockComponent(
      this.sandbox,
      EnrollWithSelectedUsersModal,
      {
        show: enrollUsersModalSpy
      }
    );

    UserEnrollmentsPageMod = TestUtils.stubRouterContext(
      UserEnrollmentsPage,
      { teamId: '1', userId: '1' },
      { currentUser }
    );
    this.sandbox.stub(UsersState.Store, 'getItem').returns(fetch.pending());
    this.sandbox.stub(TrainingSchedulesState.Store, 'getItems').returns(fetch.pending());

    component = TestUtils.renderIntoDocument(<UserEnrollmentsPageMod
      user={currentUser}
      enrollments={enrollments}
      isLoading={_.noop}
      moreAvailable={_.noop}
      loadMore={_.noop}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays a table', () => {
    const table = ReactTestUtils.scryRenderedComponentsWithType(component, ScrollableDataTable);
    expect(table).length.to.be(1);
  });

  it('displays the correct number of table rows', () => {
    const rows = ReactTestUtils.scryRenderedComponentsWithType(component, TableRow);
    expect(rows).length.to.be(1);
  });

  it('displays the plan name', () => {
    expect(node.innerHTML).to.contain('a plan');
  });

  it('displays "Not completed" if a plan has not been completed', () => {
    expect(node.innerHTML).to.contain('Not completed');
  });

  it('displays enroll modal when enroll button is clicked', () => {
    const btn = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'enroll-btn');
    expect(enrollUsersModalSpy.called).to.be.false;
    ReactTestUtils.Simulate.click(btn);
    expect(enrollUsersModalSpy.called).to.be.true;
  });

  it('displays the correct due date', () => {
    expect(node.innerHTML).to.contain('Due ');
    expect(node.innerHTML).to.not.contain('No due date');
  });
});
