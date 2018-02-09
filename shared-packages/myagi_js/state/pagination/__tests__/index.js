const React = require('react');

import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const ReactTestUtils = require('react-addons-test-utils');
const Im = require('immutable');
const _ = require('lodash');

import TestUtils from 'utilities/testing';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';

// Store for testing
const BarsState = stateDefaultsGenerator({
  entity: 'bar',
  endpoint: 'bars'
});

const BarComponent = createReactClass({
  propTypes: {
    bars: PropTypes.instanceOf(Im.List).isRequired
  },
  render() {
    return <div className="count">{this.props.bars.count()}</div>;
  }
});

const BarComponentContainer = createPaginatedStateContainer(BarComponent, {
  paginate: {
    store: BarsState.Store,
    propName: 'bars',
    limit: 1,
    getQuery() {
      return {};
    }
  },
  getDefaultProps() {
    return {
      bars: Im.List()
    };
  },
  pending() {
    return containerUtils.defaultPending(this, BarComponent);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, BarComponent, errors);
  }
});

const getCount = function (container) {
  return parseInt(ReactTestUtils.findRenderedDOMComponentWithClass(container, 'count').getDOMNode().textContent);
};

describe('PaginatedStateContainer', () => {
  beforeEach(() => {
    TestUtils.server.create();
  });

  it('can fetch items', function (done) {
    // This test runs a little slow in
    // Chrome.
    this.timeout(4000);

    const container = TestUtils.renderIntoDocument(<BarComponentContainer />);

    let count = getCount(container);
    expect(count).to.equal(0);

    expect(container.props.isLoading()).to.equal(true);

    // Respond to remote fetch.
    TestUtils.server.respondWith(/bars/, [{ id: 1 }], {
      'X-Result-Count': 100
    });

    // Update won't happen till next tick
    _.defer(() => {
      count = getCount(container);
      expect(count).to.equal(1);
      expect(container.props.isLoading()).to.equal(false);
      // Result count header was sent, so more should be available
      expect(container.props.moreAvailable()).to.equal(true);
      _.defer(() => {
        // Attempt to load more items
        container.props.loadMore();
        expect(container.props.isLoading()).to.equal(true);
        // Respond to remote fetch.
        TestUtils.server.respondWith(/bars/, [{ id: 2 }, { id: 3 }]);
        _.defer(() => {
          count = getCount(container);
          expect(BarsState.Store.state.itemContainers.count()).to.equal(3);
          // Limit was specified as 1 so only 2 should now be displayed (even
          // though store has 3 items)
          expect(count).to.equal(2);
          done();
        });
      });
    });
  });

  afterEach(() => {
    TestUtils.server.restore();
  });
});
