import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import { fetch } from 'marty';

import $ from 'jquery';

import TestUtils from 'utilities/testing';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

import {
  SearchableSelect,
  SearchableMultiSelect,
  AsyncSearchableSelect,
  ASYNC_SEARCH_THROTTLE_TIME
} from '../index';

const ReactTestUtils = require('react-addons-test-utils');

const ThingsState = stateDefaultsGenerator({
  entity: 'thing',
  endpoint: 'things'
});

class SearchableSelectContainer extends React.Component {
  constructor(props) {
    super();
    this.state = {
      options: props.options
    };
  }

  setOptions(options) {
    this.setState({ options });
  }

  render() {
    return <SearchableSelect options={this.state.options} />;
  }
}

describe('SearchableSelect', () => {
  it('displays options correctly', done => {
    let options = [];
    const searchableSelection = TestUtils.renderIntoDocument(<SearchableSelectContainer options={options} />);

    // Need to use jQuery as opposed to standard react test utils
    // as item elements are rendered outside of React's knowledge
    const node = $(ReactDOM.findDOMNode(searchableSelection));

    let items = node.find('.item');
    expect(items.length).to.equal(0);

    options = [
      {
        name: '1',
        label: '1'
      }
    ];

    searchableSelection.setOptions(options);

    items = node.find('.item');
    expect(items.length).to.equal(1);
    expect(items[0].textContent).to.equal('1');

    options = [
      {
        name: '1',
        label: '1'
      },
      {
        name: '2',
        label: '2'
      }
    ];

    searchableSelection.setOptions(options);

    // Ensure dropdown is reactive and new items are created
    // when props update
    items = node.find('.item');
    expect(items.length).to.equal(2);
    expect(items[1].textContent).to.equal('2');

    const text = node.find('.text');
    expect(text.length).to.equal(1);
    expect(text[0].textContent).to.equal('1');

    $(items[1]).click();

    _.delay(() => {
      expect(text[0].textContent).to.equal('2');
      done();
    }, 200);
  });
});

describe('SearchableMultiSelect', () => {
  let node;
  let searchableSelection;
  const options = [
    {
      value: '1',
      label: '1'
    },
    {
      value: '2',
      label: '2'
    }
  ];

  beforeEach(() => {
    searchableSelection = TestUtils.renderIntoDocument(<SearchableMultiSelect options={options} />);
    node = $(ReactDOM.findDOMNode(searchableSelection));
  });

  it('displays selected options', done => {
    const items = node.find('.item');
    expect(items.length).to.equal(options.length);
    const item = $(items[1]);
    expect(item.text()).to.equal(options[1].label);
    item.click();
    expect(_.keys(searchableSelection.state.selections).length).to.equal(1);
    done();
  });
});

describe('AsyncSearchableSelect', () => {
  let component,
    node,
    fetchFunc = function (search) {
      if (!search) return null;
      return ThingsState.Store.getItems({ search });
    },
    makeOptionFunc = function (result) {
      return {
        label: result.get('name'),
        value: result.get('id')
      };
    };

  beforeEach(function () {
    this.sandbox
      .stub(ThingsState.Store, 'getItems')
      .returns(fetch.done(Im.fromJS([{ name: 'A search', id: 1 }])));
    component = TestUtils.renderIntoDocument(<AsyncSearchableSelect fetch={fetchFunc} makeOption={makeOptionFunc} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays fetched results for search', done => {
    const searchInput = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'search-input');
    let results = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'result');
    expect(results).to.have.length(0);
    ReactTestUtils.Simulate.change(searchInput, { target: { value: 'A search' } });
    _.delay(() => {
      results = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'result');
      expect(results).to.have.length(1);
      done();
    }, ASYNC_SEARCH_THROTTLE_TIME + 100);
  });
});
