import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import { t } from 'i18n';
import TestUtils from 'utilities/testing';
import EnrollmentGroupsState from 'state/enrollment-groups';
import UsersState from 'state/users';

import { Page as EnrollmentGroupsPage } from '../page';
import { EnrollmentGroupItem } from '../enrollment-group-item';

import { SearchTextInput } from 'components/common/search';
import { Title, Description } from 'components/common/list-items';
import { CornerRemoveIcon } from 'components/common/list-items';

const ReactTestUtils = require('react-addons-test-utils');

const ENROLLMENT_GROUP_NAME = 'TestEnrollmentGroup';
// this is not a sane number of viewable users in this test scenario,
// but it shows that the test is working correctly.
const NUM_VIEWABLE_USERS = 5234;

describe('EnrollmentGroupItem', () => {
  let currentUser,
    enrollmentGroup,
    company,
    item;
  beforeEach(function () {
    this.sandbox.stub(EnrollmentGroupsState.Store, 'getItems').returns(fetch.done(Im.List()));
    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(Im.List()));
    currentUser = TestUtils.getMockCurrentUser();
    company = {
      company_name: 'company1',
      url: 'company/1'
    };
    enrollmentGroup = new Im.Map({
      id: 1,
      name: ENROLLMENT_GROUP_NAME,
      company
    });
  });

  it('displays enrollment group name correctly', () => {
    // Render AreaItem in the document
    item = TestUtils.renderIntoDocument(<EnrollmentGroupItem enrollmentGroup={enrollmentGroup} currentUser={currentUser} />);
    // Verify that AREA_NAME is being displayed
    const title = ReactTestUtils.findRenderedComponentWithType(item, Title);
    const node = ReactDOM.findDOMNode(title);
    expect(node.innerHTML).to.equal(ENROLLMENT_GROUP_NAME);
  });

  describe('When user is company admin', () => {
    beforeEach(() => {
      currentUser.get('learner').is_company_admin = true;
      item = TestUtils.renderIntoDocument(<EnrollmentGroupItem enrollmentGroup={enrollmentGroup} currentUser={currentUser} />);
    });

    it('displays enrollment group delete button', () => {
      const delBtns = ReactTestUtils.scryRenderedComponentsWithType(item, CornerRemoveIcon);
      expect(delBtns.length).to.equal(1);
    });
  });

  describe('When user is not company admin', () => {
    beforeEach(() => {
      currentUser.get('learner').is_company_admin = false;
      item = TestUtils.renderIntoDocument(<EnrollmentGroupItem enrollmentGroup={enrollmentGroup} currentUser={currentUser} />);
    });

    it('does not display enrollment group deletion button when user is not company admin', () => {
      const delBtns = ReactTestUtils.scryRenderedComponentsWithType(item, CornerRemoveIcon);
      expect(delBtns.length).to.equal(0);
    });
  });

  describe('When user clicks on item', done => {
    it('transitions to the enrollment group', () => {
      const EnrollmentGroupItemMod = TestUtils.stubRouterContext(
        EnrollmentGroupItem,
        { enrollmentGroup },
        {},
        {
          transitionTo: opts => {
            expect(opts.to).to.equal('area');
            expect(opts.params.enrollmentGroupId).to.equal(enrollmentGroup.get('id'));
            done();
          }
        }
      );
      const item = TestUtils.renderIntoDocument(<EnrollmentGroupItemMod enrollmentGroup={enrollmentGroup} />);
      ReactTestUtils.Simulate.click(item);
    });
  });
});

describe('EnrollmentGroupsPage', () => {
  let currentUser,
    MockEnrollmentGroupItem,
    page;

  const EnrollmentGroupsPageContext = TestUtils.stubAppContext(EnrollmentGroupsPage, undefined, {
    currentUser: TestUtils.getMockCurrentUser()
  });

  const EnrollmentGroupsPageContextAdmin = TestUtils.stubAppContext(
    EnrollmentGroupsPage,
    undefined,
    {
      currentUser: TestUtils.getMockCurrentUser({ is_company_admin: true })
    }
  );

  beforeEach(function () {
    this.sandbox.stub(EnrollmentGroupsState.Store, 'getItems').returns(fetch.done(Im.List()));
    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(Im.List()));
    currentUser = TestUtils.getMockCurrentUser();
  });

  describe('When user is not company admin', () => {
    beforeEach(() => {
      page = TestUtils.renderIntoDocument(<EnrollmentGroupsPageContext />);
    });

    it('does not display create enrollment group button', () => {
      const node = ReactDOM.findDOMNode(page);
      expect(node.innerHTML).not.to.contain(t('create_group'));
    });
  });

  describe('When user is company admin', () => {
    beforeEach(() => {
      page = TestUtils.renderIntoDocument(<EnrollmentGroupsPageContextAdmin />);
    });

    it('displays create enrollment group button', () => {
      const node = ReactDOM.findDOMNode(page);
      expect(node.innerHTML).to.contain(t('create_group'));
    });
  });

  it('displays enrollment group items', () => {
    page = TestUtils.renderIntoDocument(<EnrollmentGroupsPageContext />);

    let items = ReactTestUtils.scryRenderedComponentsWithType(page, EnrollmentGroupItem);
    expect(items.length).to.equal(0);

    EnrollmentGroupsState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        url: 'enrollment_group/1',
        members: [],
        num_viewable_users: NUM_VIEWABLE_USERS,
        name: ENROLLMENT_GROUP_NAME,
        company: {
          company_name: 'company1',
          url: 'company/1'
        }
      }
    ])));

    page = TestUtils.renderIntoDocument(<EnrollmentGroupsPageContext />);

    items = ReactTestUtils.scryRenderedComponentsWithType(page, EnrollmentGroupItem);
    expect(items.length).to.equal(1);

    const node = ReactDOM.findDOMNode(items[0]);
    expect(node.innerHTML).to.contain(NUM_VIEWABLE_USERS);
  });

  it('is searchable', done => {
    EnrollmentGroupsState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        name: 'X'
      },
      {
        id: 2,
        name: 'Y'
      },
      {
        id: 3,
        name: 'Z'
      }
    ])));

    const page = TestUtils.renderIntoDocument(<EnrollmentGroupsPageContext />);

    const items = ReactTestUtils.scryRenderedComponentsWithType(page, EnrollmentGroupItem);
    expect(items.length).to.equal(3);

    const searchInput = ReactTestUtils.findRenderedComponentWithType(page, SearchTextInput);
    const input = ReactTestUtils.findRenderedDOMComponentWithTag(searchInput, 'input').getDOMNode();

    ReactTestUtils.Simulate.change(input, { target: { value: 'X' } });

    const _items = ReactTestUtils.scryRenderedComponentsWithType(page, EnrollmentGroupItem);
    expect(_items.length).to.equal(3);

    done();
  });
});
