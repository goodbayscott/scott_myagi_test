import React from 'react';
import Radium from 'radium';

const Im = require('immutable');
const _ = require('lodash');
const cx = require('classnames');

const Fuse = require('fuse.js');

import Style from 'style/index.js';

import { TextInput } from 'components/common/form/input';
// import {IntlMixin} from 'react-intl';

const SEARCH_THROTTLE_TIME = 400;
const ID_KEY = 'id';
import { t } from 'i18n';

const styles = {
  borderlessSearch: { border: 'none', width: 120, container: { margin: '5px 0px 5px 5px' } }
};

export const SearchTextInput = React.createClass({
  /*
    Simple text input which is utilised by both
    `searchMixinFactory` and `remoteSearchMixinFactory`

    TODO - Rename this to SearchInput and rename existing
    SearchInput component to something else.
  */
  // mixins: [
  //   IntlMixin
  // ],

  getValue() {
    if (!this.refs.textInput) return '';
    return this.refs.textInput.getValue();
  },
  setValue(value) {
    this.refs.textInput.setValue(value);
  },
  reset() {
    this.refs.textInput.reset();
  },
  render() {
    return (
      <TextInput
        initialValue={
          this.props.initialValue === undefined ? `${t('search')}...` : this.props.initialValue
        }
        name="search"
        onChange={this.props.onChange}
        icon="search"
        iconStyle={this.props.iconStyle}
        style={Style.funcs.merge({ container: { width: 260 } }, this.props.style)}
        ref="textInput"
      />
    );
  }
});

export class SearchInput extends React.Component {
  /*
    Displays a text input. When input is changed,
    uses Fuze library (http://kiro.me/projects/fuse.html)
    to search the supplied `dataSet` prop and returns the
    new search results via the `onResultsChange` callback.

    TODO - Should search logic be in the searchMixin?
  */
  static propTypes = {
    // NOTE: Dataset can be a list of objects or a list of lists.
    dataSet: React.PropTypes.instanceOf(Im.List).isRequired,
    onResultsChange: React.PropTypes.func.isRequired,
    onInputChange: React.PropTypes.func,
    // NOTE: If dataset is a list of lists then keys should be a list of indexes.
    searchOptions: React.PropTypes.object
  };

  static defaultProps = {
    searchOptions: {}
  };

  constructor(props, defaultProps) {
    super(props, defaultProps);
    const transformedDataSet = this.transformDataSet(props.dataSet);
    // throttle updates to prevent lots of rerendering
    const throttledUpdateResults = _.throttle(this.updateResults, SEARCH_THROTTLE_TIME, {
      leading: false,
      trailing: true
    });
    this.state = {
      fuse: new Fuse(transformedDataSet, this.getSearchOpts()),
      throttledUpdateResults
    };
  }

  getSearchOpts = () => {
    const opts = this.props.searchOptions;
    if (opts.keys) {
      // Fuze will complain if keys are not strings, however
      // in case that dataSet is a list of lists it is nice to be
      // able to specify keys as just ints.
      opts.keys = _.map(opts.keys, key => key.toString());
    }
    return _.extend(
      {
        id: 'id',
        shouldSort: true
      },
      opts
    );
  };
  componentWillReceiveProps(nextProps) {
    const transformedDataSet = this.transformDataSet(nextProps.dataSet);
    // Probably not very efficient for large data sets!
    if (JSON.stringify(transformedDataSet) === JSON.stringify(this.props.dataSet.toJSON())) {
      return;
    }
    this.setState({
      fuse: new Fuse(transformedDataSet, this.getSearchOpts())
    });
  }

  isListOfLists(ds) {
    return ds.get(0) instanceof Im.List;
  }

  transformDataSet = ds => {
    let transformed = ds.toJSON();
    if (this.isListOfLists(ds)) {
      let id = 1;
      transformed = _.map(transformed, row => {
        const asObj = {};
        let i = 0;
        row.forEach(val => {
          // Keys must be strings
          // or else Fuze library will complain
          asObj[i.toString()] = val;
          asObj[ID_KEY] = id;
          i += 1;
        });
        id += 1;
        return asObj;
      });
    }
    return transformed;
  };
  search = val =>
    // Will return ids of results
    this.state.fuse.search(val);
  transformResults = results => {
    // Takes list of ids and returns Im.List of original objects.
    let imResults = Im.List();
    const self = this;
    const isListOfLists = this.isListOfLists(this.props.dataSet);
    results.forEach(id => {
      let item;
      // If dataset is list of lists then results will be indexes in dataset.
      // TODO - Same could easily be true for lists of objects? Would results in
      // quicker lookup.
      if (isListOfLists) {
        // ids given to each list item are 1-indexed to prevent first list
        // item ever being returned as a result. List is 0 indexed though.
        item = self.props.dataSet.get(id - 1);
      } else {
        item = self.props.dataSet.find(i => i.get(ID_KEY) === id);
      }
      if (item) {
        imResults = imResults.push(item);
      }
    });
    return imResults;
  };
  onChange = evt => {
    const newValue = evt.target.value;
    if (this.props.onInputChange) this.props.onInputChange(newValue);
    this.state.throttledUpdateResults(newValue);
  };
  updateResults = newValue => {
    if (newValue) {
      let results = this.search(newValue);
      this.state.lastResults = results;
      results = this.transformResults(results);
      this.onResultsChange(results, newValue);
    } else {
      this.onResultsChange(this.props.dataSet, newValue);
    }
  };
  onResultsChange = (newResults, searchValue) => {
    this.props.onResultsChange(newResults, searchValue);
  };
  reset = () => {
    this.refs.textInput.reset();
  };
  render() {
    return <SearchTextInput ref="textInput" onChange={this.onChange} style={this.props.style} />;
  }
}

export const searchMixinFactory = function (propName, opts) {
  /*
    Mixin factory which reduces the boilerplate when
    adding a search input to a component and updating
    some data within that component as the search results
    change.

    Example usage:

    var FoosSearchComponent = React.createClass({
      mixins: [
        searchMixinsFactory('foos', {
          keys: ['name']
        })
      ],
      propTypes: {
        foos: React.PropTypes.instanceOf(Im.List).isRequired
      }
      render: function() {
        <div>
          <SearchInput {...this.getSearchInputProps()} />
          <FoosList foos={this.state.searchResults.foos}/>
        </div>
      }
    });

    Here, the `FoosSearchComponent` takes a list of foos, and then
    uses the boilerplate funcs provided by `searchMixinFactory`
    to make searching those foos by name easy. The factory will
    automatically create a `this.state.searchResults.foos` attr
    which will be updated as the user enters data into the
    `SearchInput`. Changes to `this.state.searchResults.foos` will
    flow into the `FoosList` component and update the foos displayed
    on the page.
  */
  return {
    getInitialState() {
      const state = {
        searchResults: {}
      };
      state.searchResults[propName] = this.props[propName];
      return state;
    },
    componentWillReceiveProps(nextProps) {
      const state = {
        searchResults: {}
      };
      state.searchResults[propName] = nextProps[propName];
      this.setState(state);
    },
    onResultsChange(newResults) {
      const state = {
        searchResults: {}
      };
      state.searchResults[propName] = newResults;
      this.setState(state);
    },
    getSearchInputProps() {
      return {
        dataSet: this.props[propName],
        onResultsChange: r => this.onResultsChange(r),
        searchOptions: opts
      };
    },
    getSearchInput(props = {}) {
      return <SearchInput {...this.getSearchInputProps()} {...props} />;
    }
  };
};

export const remoteSearchMixinFactory = function (actionCreator, opts) {
  /*
    Takes an `actionCreator` which triggers a remote search for new
    data. Uses that `actionCreator` to build a
    mixin. When that mixin is included in a component, you can
    use the the `getSearchInput` function included by this
    component to render a search input. When that search input
    is changed (i.e. the user enters text into it), the action
    creator will be passed the user's input. It is then up to
    the `actionCreator` to trigger a remote fetch of new data
    and to update the results list (which is not managed
    by this component) on the page.
  */

  return {
    getInitialState() {
      // throttle updates to prevent lots of refetching
      const throttledOnChange = _.throttle(this.onChange.bind(this), SEARCH_THROTTLE_TIME, {
        leading: false,
        trailing: true
      });
      return {
        throttledOnChange
      };
    },
    onChange(evt) {
      if (!this.refs.searchInput) return;
      const newValue = this.refs.searchInput.getValue();
      actionCreator(newValue);
    },
    getSearchInputProps(extraProps) {
      if (extraProps && extraProps.borderless) {
        extraProps.style = {
          ...styles.borderlessSearch,
          ...(extraProps.style || {})
        };
      }
      return _.extend(
        {
          onChange: this.state.throttledOnChange
        },
        extraProps
      );
    },
    getSearchInput(extraProps) {
      return <SearchTextInput ref="searchInput" {...this.getSearchInputProps(extraProps)} />;
    },
    getSearchVal() {
      if (!this.refs.searchInput) return '';
      return this.refs.searchInput.getValue();
    },
    clearSearch() {
      actionCreator('');
      if (!this.refs.searchInput) return;
      this.refs.searchInput.setValue('');
    }
  };
};
