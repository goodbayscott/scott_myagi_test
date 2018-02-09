import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';

import Im from 'immutable';

import TestUtils from 'utilities/testing';
import TeamsState from 'state/teams';
import UsersState from 'state/users';

import { Page as TeamsPage } from '../page';
import { TeamItem, TeamItemInner } from '../team-item';

import { SearchTextInput } from 'components/common/search';
import { AvatarImageCollection, AvatarImage } from 'components/common/avatar-images';

const ReactTestUtils = require('react-addons-test-utils');

const TEAM_NAME = 'TestTeam';
const TEAM_DESCRIPTION = 'Test Team Description';

describe('TeamItem', () => {
  const team = new Im.Map({
    id: 1,
    name: TEAM_NAME,
    description: TEAM_DESCRIPTION,
    members: []
  });

  const members = Im.List([
    Im.Map({
      id: 1,
      profile_photo: '/media/image.jpg',
      user: {
        first_name: 'Myagi',
        last_name: 'Myagi'
      }
    })
  ]);

  it('displays team name correctly', () => {
    // Render TeamItem in the document
    const card = TestUtils.renderIntoDocument(<TeamItemInner team={team} members={members} />);
    const node = ReactDOM.findDOMNode(card);
    expect(node.innerHTML).to.contain(TEAM_NAME);
  });

  describe('When team has members', () => {
    it('displays avatar images', () => {
      const card = TestUtils.renderIntoDocument(<TeamItemInner team={team} members={members} />);
      const avatars = ReactTestUtils.scryRenderedComponentsWithType(card, AvatarImage);
      expect(avatars.length).to.equal(members.count());
      expect(avatars.length).to.equal(1);
    });

    it('does not display team deletion button', () => {
      const item = TestUtils.renderIntoDocument(<TeamItemInner team={team} members={members} />);
      const delBtns = ReactTestUtils.scryRenderedDOMComponentsWithClass(item, 'trash');
      expect(delBtns.length).to.equal(0);
    });
  });

  describe('When team has no members', () => {
    it('displays team deletion button', () => {
      const item = TestUtils.renderIntoDocument(<TeamItemInner team={team} members={Im.List()} />);
      const delBtns = ReactTestUtils.scryRenderedDOMComponentsWithClass(item, 'trash');
      expect(delBtns.length).to.equal(1);
    });
  });

  describe('When user clicks on card', done => {
    it('transitions to the team', () => {
      const TeamItemMod = TestUtils.stubRouterContext(
        TeamItemInner,
        { team, members },
        {},
        {
          transitionTo: opts => {
            expect(opts.to).to.equal('team');
            expect(opts.params.teamId).to.equal(team.get('id'));
            done();
          }
        }
      );
      const card = TestUtils.renderIntoDocument(<TeamItemMod team={team} members={members} />);
      ReactTestUtils.Simulate.click(card);
    });
  });
});

describe('TeamsPage', () => {
  const TeamsPageContext = TestUtils.stubAppContext(TeamsPage, undefined, {
    currentUser: TestUtils.getMockCurrentUser()
  });

  beforeEach(function () {
    this.sandbox.stub(TeamsState.Store, 'getItems').returns(fetch.done(Im.List()));
    this.sandbox.stub(TeamsState.Store, 'getKnownCountForQuery').returns(3);
    this.sandbox.stub(UsersState.Store, 'getItems').returns(fetch.done(Im.List()));
  });

  it('displays team cards', () => {
    let page = TestUtils.renderIntoDocument(<TeamsPageContext />);

    let cards = ReactTestUtils.scryRenderedComponentsWithType(page, TeamItem);
    expect(cards.length).to.equal(0);

    TeamsState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        name: TEAM_NAME,
        members: []
      }
    ])));

    page = TestUtils.renderIntoDocument(<TeamsPageContext />);

    cards = ReactTestUtils.scryRenderedComponentsWithType(page, TeamItem);
    expect(cards.length).to.equal(1);
  });

  it('is searchable', done => {
    TeamsState.Store.getItems.returns(fetch.done(Im.fromJS([
      {
        id: 1,
        name: 'X',
        members: []
      },
      {
        id: 2,
        name: 'Y',
        members: []
      },
      {
        id: 3,
        name: 'Z',
        members: []
      }
    ])));

    const page = TestUtils.renderIntoDocument(<TeamsPageContext />);

    const cards = ReactTestUtils.scryRenderedComponentsWithType(page, TeamItem);
    expect(cards.length).to.equal(3);

    const searchInput = ReactTestUtils.findRenderedComponentWithType(page, SearchTextInput);
    const input = ReactTestUtils.findRenderedDOMComponentWithTag(searchInput, 'input').getDOMNode();

    ReactTestUtils.Simulate.change(input, { target: { value: 'X' } });

    const _cards = ReactTestUtils.scryRenderedComponentsWithType(page, TeamItem);
    expect(_cards.length).to.equal(3);

    done();
  });
});
