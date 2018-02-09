import React from 'react';
import cx from 'classnames';

import Style from 'style';

import TeamsState from 'state/teams';
import ListComponentState from './component-state';

import { LoadingContainer } from 'components/common/loading';
import { Hoverable } from '../hover';
import { UsersListContainer } from './common';

const tliStyle = {
  container: {
    padding: '1em',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  containerExpanded: {
    backgroundColor: Style.vars.colors.get('hoverGrey')
  },
  icon: {
    color: Style.vars.colors.get('xDarkGrey'),
    float: 'left',
    marginRight: '0.5em'
  },
  iconHover: {
    color: Style.vars.colors.get('textBlack')
  },
  userCount: {
    width: '4em',
    textAlign: 'left'
  }
};

const TeamListItem = React.createClass({
  getInitialState() {
    return {
      expanded: false,
      allSelected: ListComponentState.Store.isSelectedEntity(this.props.team, 'teams')
    };
  },
  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  },
  toggleSelected(evt) {
    evt.stopPropagation();
    ListComponentState.ActionCreators.toggleTeamSelected(this.props.team);
  },
  componentDidMount() {
    this.state.listener = ListComponentState.Store.addChangeListener(this.onStoreChange);
  },
  componentWillUnmount() {
    this.state.listener.dispose();
  },
  onStoreChange() {
    const allSelected = ListComponentState.Store.isSelectedEntity(this.props.team, 'teams');
    this.setState({ allSelected });
  },
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.allSelected !== nextState.allSelected) return true;
    if (this.state.expanded !== nextState.expanded) return true;
    return false;
  },
  render() {
    const allSelected = this.state.allSelected;
    const cStyle = Style.funcs.mergeIf(
      this.state.expanded,
      tliStyle.container,
      tliStyle.containerExpanded
    );
    const iconClasses = cx(
      { green: allSelected },
      { checkmark: allSelected },
      { minus: !allSelected },
      { square: !allSelected },
      'icon'
    );
    const noTeam = ListComponentState.Store.isNoTeam(this.props.team);
    return (
      <div className="item" style={cStyle} onClick={this.toggleExpanded}>
        <Hoverable
          style={tliStyle.icon}
          hoverStyle={tliStyle.iconHover}
          onClick={this.toggleSelected}
        >
          <i className={iconClasses} />
        </Hoverable>
        <div className=" left floated content">
          <div className="header">{this.props.team.get('name')}</div>
        </div>
        <i className="right floated down angle icon" />
        {!noTeam ? (
          <div style={tliStyle.userCount} className="right floated">
            <i className="users icon" />
            {this.props.team.get('members').length}
          </div>
        ) : null}
        <div style={Style.common.clearBoth} />
        {this.state.expanded ? (
          <UsersListContainer key="usersList" ref="usersList" team={this.props.team} />
        ) : null}
      </div>
    );
  }
});

const etlStyle = {
  // This value is chosen to match up with the default height of the 'Search'
  // tab. Prevents modal from jumping around when tab is changed.
  maxHeight: '20.5em',
  overflowX: 'hidden',
  overflowY: 'scroll',
  border: `1px solid ${Style.vars.colors.get('mediumGrey')}`
};

const ExpandableTeamsList = React.createClass({
  propTypes: {
    teams: TeamsState.Types.many.isRequired
  },
  getInitialState() {
    return {
      allSelected: false
    };
  },
  componentDidMount() {
    this.state.listener = ListComponentState.Store.addChangeListener(this.onStoreChange);
  },
  componentWillUnmount() {
    this.state.listener.dispose();
  },
  onStoreChange() {
    const allSelected = ListComponentState.Store.allTeamsAreSelected();
    this.setState({ allSelected });
  },
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.allSelected !== nextState.allSelected) return true;
    return false;
  },
  toggleSelectedTeams(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (this.state.allSelected) {
      // Select none
      ListComponentState.ActionCreators.setSelectedForManyTeams(this.props.teams, false);
    } else {
      // Select all
      ListComponentState.ActionCreators.setSelectedForManyTeams(this.props.teams, true);
    }
  },
  render() {
    const selectText = this.state.allSelected ? 'Select None' : 'Select All';
    return (
      <div>
        <button className="ui basic button" onClick={this.toggleSelectedTeams}>
          {selectText}
        </button>
        <div className="ui selection list" style={etlStyle}>
          {this.props.teams
            .map(team => <TeamListItem className="item" key={team.get('id')} team={team} />)
            .toJSON()}
        </div>
      </div>
    );
  }
});

export const TeamsList = React.createClass({
  propTypes: {
    teams: TeamsState.Types.many
  },
  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={{
            teams: this.props.teams
          }}
          createComponent={props => <ExpandableTeamsList teams={props.teams} />}
          noDataText="There are no teams available."
        />
      </div>
    );
  }
});
