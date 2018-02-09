import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';

import Style from 'style/index';

import { t } from 'i18n';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import TeamsState from 'state/teams';
import PublicTeamsState from 'state/public-teams';

import { AsyncSearchableSelect, SearchableSelect } from 'components/common/form/select';

export class TeamSearchableSelect extends React.Component {
  /*
    `AsyncSearchableSelect` which is set up to
    search for teams (i.e. learner groups) within a given company.
  */

  static propTypes = {
    company: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  fetch = search => {
    if (!search) return null;
    return TeamsState.Store.getItems({
      limit: 20,
      name__icontains: search,
      company: this.props.company.get('id'),
      ordering: 'name',
      fields: ['name', 'url', 'id']
    });
  };

  makeOption = u => ({
    value: u.get('url'),
    label: u.get('name')
  });

  isValid() {
    return this.refs.searchableSelection.isValid();
  }

  render() {
    return (
      <AsyncSearchableSelect
        placeholder="Search for a team..."
        {...this.props}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'teamURL'}
        ref="searchableSelection"
        required
      />
    );
  }
}

class PublicTeamSearchableSelectInner extends React.Component {
  /*
    `SearchableSelect` which is set up to
    search for public teams within a given company
  */

  static data = {
    teams: {
      many: true,
      required: false,
      fields: ['name', 'url', 'id']
    }
  };

  static propTypes = $y.propTypesFromData(PublicTeamSearchableSelectInner, {
    company: React.PropTypes.instanceOf(Im.Map)
  });

  static defaultProps = {
    required: true
  };

  makeOption = tp => ({
    value: tp.get('url'),
    label: tp.get('name')
  });

  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  isValid() {
    return this.refs.searchableSelection.isValid();
  }

  render() {
    const loading = !this.props.teams;
    let opts;
    if (loading) opts = [];
    else opts = this.props.teams.map(this.makeOption).toArray();
    if (this.props.allowNoneOpt) {
      opts.push({ value: 'create a team', label: 'Other' });
    }
    const placeholder = this.props.placeholder
      ? this.props.placeholder
      : `${t('select_a_team')}...`;
    const noSelectionText = loading ? 'Loading...' : placeholder;
    return (
      <SearchableSelect
        noSelectionText={noSelectionText}
        {...this.props}
        options={opts}
        name={this.props.name || 'teamURL'}
        ref="searchableSelection"
        style={{ container: { marginBottom: 10 } }}
        required={this.props.required}
      />
    );
  }
}

export const PublicTeamSearchableSelect = Marty.createContainer(PublicTeamSearchableSelectInner, {
  listenTo: [PublicTeamsState.Store],
  fetch: {
    teams() {
      return PublicTeamsState.Store.getItems({
        limit: 0,
        ordering: 'name',
        fields: $y.getFields(PublicTeamSearchableSelectInner, 'teams'),
        company: this.props.company.get('id')
      });
    }
  },
  getNameAndValue() {
    const inner = this.getInnerComponent();
    if (!inner) return {};
    return inner.getNameAndValue();
  },
  isValid() {
    const inner = this.getInnerComponent();
    if (!inner) return true;
    return inner.isValid();
  },
  pending() {
    return containerUtils.defaultPending(this, PublicTeamSearchableSelectInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, PublicTeamSearchableSelectInner, errors);
  }
});
