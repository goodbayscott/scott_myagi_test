import React from 'react';
import sinon from 'sinon';
import ReactTestUtils from 'react-addons-test-utils';
import Im from 'immutable';

import TestUtils from 'utilities/testing';

import { ChannelsCollection } from '../page';
import ChannelShareRequestsState from 'state/channel-share-requests';
import { ChannelItem } from '../channel-item';

import ChannelsState from 'state/channels';
import PublicCompaniesState from 'state/public-companies';

const currentUser = TestUtils.getMockCurrentUser();

describe('ChannelsPage', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(ChannelsState.Store, 'getItems').returns(Im.List());
    sandbox.stub(ChannelShareRequestsState.Store, 'getItems').returns(Im.List());
    sandbox.stub(PublicCompaniesState.Store, 'getItems').returns(Im.List());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('displays many channel cards', () => {
    const WrappedChannelsCollection = TestUtils.stubRouterContext(
      TestUtils.stubAppContext(ChannelsCollection, undefined, {
        currentUser
      }),
      {},
      {}
    );

    const PROPS = {
      shouldCancelStart: true,
      onSortEnd: () => {},
      reorderEnabled: false,
      axis: 'xy'
    };

    let page = TestUtils.renderIntoDocument(<WrappedChannelsCollection channels={[]} {...PROPS} />);

    let cards = ReactTestUtils.scryRenderedComponentsWithType(page, ChannelItem);
    expect(cards.length).to.equal(0);

    const channels = Im.fromJS([
      {
        url: 'http://localhost:8000/companies/trainingunits/170/',
        id: 170,
        deactivated: null,
        training_plans: ['http://localhost:8000/api/v1/training_plans/4168/'],
        logo:
          'https://myagi-production.s3.amazonaws.com/training_unit/logo14535969-d92a-4310-a1f5-a31800d66441.jpeg',
        reached_users_count: 0,
        subscribed_companies_count: 0,
        training_plans_count: 1,
        name: 'Blacks - Equipment Department',
        description: 'Blacks - Equipment Department',
        public: false,
        company: 'http://localhost:8000/api/v1/companies/43/',
        shared: [],
        owners: ['http://localhost:8000/api/v1/learners/9/']
      },
      {
        url: 'http://localhost:8000/companies/trainingunits/170/',
        id: 171,
        deactivated: null,
        training_plans: ['http://localhost:8000/api/v1/training_plans/4168/'],
        logo:
          'https://myagi-production.s3.amazonaws.com/training_unit/logo14535969-d92a-4310-a1f5-a31800d66441.jpeg',
        reached_users_count: 0,
        subscribed_companies_count: 0,
        training_plans_count: 1,
        name: 'Blacks - Equipment Department',
        description: 'Blacks - Equipment Department',
        public: false,
        company: 'http://localhost:8000/api/v1/companies/43/',
        shared: [],
        owners: ['http://localhost:8000/api/v1/learners/9/']
      }
    ]);

    page = TestUtils.renderIntoDocument(<WrappedChannelsCollection channels={channels} {...PROPS} />);

    cards = ReactTestUtils.scryRenderedComponentsWithType(page, ChannelItem);
    expect(cards.length).to.equal(2);
  });
});
