const Marty = require('marty');
const React = require('react');
const ReactDOM = require('react-dom');
const Im = require('immutable');
const _ = require('lodash');
const cx = require('classnames');

import Style from 'style/index.js';

import UsersState from 'state/users';

import { AsyncSearchableSelect } from 'components/common/form/select';

export const UserSearchableSelect = React.createClass({
  /*
    `AsyncSearchableSelect` which is set up to
    search for users within a given company. Should be
    used in forms where user within company needs to be
    selected.
  */
  propTypes: {
    company: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  fetch(search) {
    if (!search) return null;
    let query = {
      limit: 40,
      search,
      ordering: 'first_name',
      learner__company: this.props.company.get('id'),
      fields: ['first_name', 'last_name', 'url', 'id']
    };
    if (this.props.currentUser && this.props.excludeCurrentUser) {
      query = _.extend(query, {
        exclude__id: this.props.currentUser.get('id')
      });
    }
    return UsersState.Store.getItems(query);
  },
  makeOption(u) {
    return {
      value: u.get('url'),
      label: u.get('full_name')
    };
  },
  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  },
  isValid() {
    const val = this.refs.searchableSelection.getNameAndValue();
    if (this.props.currentUserIsInvalid && this.props.currentUser) {
      if (_.has(val, 'user') && val.user && val.user === this.props.currentUser.get('url')) {
        this.props.userSelectionError();
        return false;
      }
    }
    return this.refs.searchableSelection.isValid();
  },
  render() {
    return (
      <AsyncSearchableSelect
        {...this.props}
        placeholder={this.props.placeholder || 'Search for a User...'}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'userURL'}
        ref="searchableSelection"
        required
      />
    );
  }
});

export const LearnerSearchableSelect = React.createClass({
  // TODO - This is almost entirely copy and pasted from above.
  // Should use mixin to share functionality.
  propTypes: {
    company: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  fetch(search) {
    if (!search) return null;
    return UsersState.Store.getItems({
      limit: 20,
      search,
      ordering: 'first_name',
      company: this.props.company.get('id'),
      fields: [
        // NOTE - If these fields do not match
        // fields for other fetches on the page then
        // can get subtle issues as those page items
        // will start disappearing if they are fetched
        // by this query as well.
        '*',
        'learner.profile_photo',
        'learner.url'
      ]
    });
  },
  makeOption(u) {
    return {
      value: u.get('learner').url,
      label: u.get('full_name')
    };
  },
  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  },
  isValid() {
    return this.refs.searchableSelection.isValid();
  },
  render() {
    return (
      <AsyncSearchableSelect
        initialValue="Search for a User..."
        {...this.props}
        store={UsersState.Store}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'learnerURL'}
        ref="searchableSelection"
        required
      />
    );
  }
});
