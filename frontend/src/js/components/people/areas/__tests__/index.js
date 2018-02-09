import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';

import Im from 'immutable';

import TestUtils from 'utilities/testing';
import AreasState from 'state/areas';
import UsersState from 'state/users';

import { Page as AreasPage } from '../page';
import { AreaItem } from '../area-item';

import { SearchTextInput } from 'components/common/search';
import { Title, Description } from 'components/common/list-items';
import { AvatarImage } from 'components/common/avatar-images';
import { CornerRemoveIcon } from 'components/common/list-items';

const ReactTestUtils = require('react-addons-test-utils');

const AREA_NAME = 'TestArea';

describe('AreaItem', () => {
  const area = new Im.Map({
    id: 1,
    name: AREA_NAME,
    learnergroup_set: [],
    managers: []
  });

  it('displays area name correctly', () => {
    // Render AreaItem in the document
    const item = TestUtils.renderIntoDocument(<AreaItem area={area} />);
    // Verify that AREA_NAME is being displayed
    const title = ReactTestUtils.findRenderedComponentWithType(item, Title);
    const node = ReactDOM.findDOMNode(title);
    expect(node.innerHTML).to.equal(AREA_NAME);
  });

  describe('When area has multiple managers', () => {
    let areaWithManagers;
    beforeEach(() => {
      areaWithManagers = new Im.Map({
        id: 1,
        name: AREA_NAME,
        learnergroup_set: [],
        managers: [
          Im.Map({
            first_name: 'manager 1',
            last_name: 'last_name',
            learner: {
              profile_photo: '/img.jpg'
            }
          }),
          Im.Map({
            first_name: 'manager 2',
            last_name: 'last_name',
            learner: {
              profile_photo: '/img2.jpg'
            }
          })
        ]
      });
    });

    it('displays avatar images of manaagers', () => {
      const item = TestUtils.renderIntoDocument(<AreaItem area={areaWithManagers} />);
      const avatarImages = ReactTestUtils.scryRenderedComponentsWithType(item, AvatarImage);
      expect(avatarImages.length).to.equal(2);
    });
  });

  describe('When area has no teams', () => {
    it('displays area deletion button', () => {
      const item = TestUtils.renderIntoDocument(<AreaItem area={area} />);
      const delBtns = ReactTestUtils.scryRenderedComponentsWithType(item, CornerRemoveIcon);
      expect(delBtns.length).to.equal(1);
    });
  });

  describe('When user clicks on item', done => {
    it('transitions to the area', () => {
      const AreaItemMod = TestUtils.stubRouterContext(
        AreaItem,
        { area },
        {},
        {
          transitionTo: opts => {
            expect(opts.to).to.equal('area');
            expect(opts.params.areaId).to.equal(area.get('id'));
            done();
          }
        }
      );
      const item = TestUtils.renderIntoDocument(<AreaItemMod area={area} />);
      ReactTestUtils.Simulate.click(item);
    });
  });
});

describe('AreasPage', () => {
  let currentUser,
    MockAreaItem;

  const AreasPageContext = TestUtils.stubAppContext(AreasPage, undefined, {
    currentUser: TestUtils.getMockCurrentUser()
  });

  beforeEach(function () {
    this.sandbox.stub(AreasState.Store, 'getItems').returns(fetch.done(Im.List()));
    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(Im.List()));
    currentUser = TestUtils.getMockCurrentUser();
  });

  it('displays area items', () => {
    let page = TestUtils.renderIntoDocument(<AreasPageContext />);

    let items = ReactTestUtils.scryRenderedComponentsWithType(page, AreaItem);
    expect(items.length).to.equal(0);

    AreasState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        name: AREA_NAME,
        learnergroup_set: [],
        managers: []
      }
    ])));

    page = TestUtils.renderIntoDocument(<AreasPageContext />);

    items = ReactTestUtils.scryRenderedComponentsWithType(page, AreaItem);
    expect(items.length).to.equal(1);
  });

  it('is searchable', done => {
    AreasState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        name: 'X',
        learnergroup_set: [],
        managers: []
      },
      {
        id: 2,
        name: 'Y',
        learnergroup_set: [],
        managers: []
      },
      {
        id: 3,
        name: 'Z',
        learnergroup_set: [],
        managers: []
      }
    ])));

    const page = TestUtils.renderIntoDocument(<AreasPageContext />);

    const items = ReactTestUtils.scryRenderedComponentsWithType(page, AreaItem);
    expect(items.length).to.equal(3);

    const searchInput = ReactTestUtils.findRenderedComponentWithType(page, SearchTextInput);
    const input = ReactTestUtils.findRenderedDOMComponentWithTag(searchInput, 'input').getDOMNode();

    ReactTestUtils.Simulate.change(input, { target: { value: 'X' } });

    const _items = ReactTestUtils.scryRenderedComponentsWithType(page, AreaItem);
    expect(_items.length).to.equal(3);

    done();
  });
});
