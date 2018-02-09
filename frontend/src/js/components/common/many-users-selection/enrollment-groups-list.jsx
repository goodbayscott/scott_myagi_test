import React from 'react';
import cx from 'classnames';

import Style from 'style';

import EnrollmentGroupsState from 'state/enrollment-groups';
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

const EnrollmentGroupListItem = React.createClass({
  getInitialState() {
    return {
      expanded: false,
      allSelected: ListComponentState.Store.isSelectedEntity(
        this.props.enrollmentGroup,
        'enrollmentGroups'
      )
    };
  },
  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  },
  toggleSelected(evt) {
    evt.stopPropagation();
    ListComponentState.ActionCreators.toggleEnrollmentGroupSelected(this.props.enrollmentGroup);
  },
  componentDidMount() {
    this.state.listener = ListComponentState.Store.addChangeListener(this.onStoreChange);
  },
  componentWillUnmount() {
    this.state.listener.dispose();
  },
  onStoreChange() {
    const allSelected = ListComponentState.Store.isSelectedEntity(
      this.props.enrollmentGroup,
      'enrollmentGroups'
    );
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
          <div className="header">{this.props.enrollmentGroup.get('name')}</div>
        </div>
        <i className="right floated down angle icon" />
        {
          // !noEnrollmentGroup ?
          //   <div style={tliStyle.userCount} className="right floated">
          //     <i className="users icon"></i>
          //     {this.props.enrollmentGroup.get('members').length}
          //   </div>
          // : null
        }
        <div style={Style.common.clearBoth} />
        {this.state.expanded ? (
          <UsersListContainer
            key="usersList"
            ref="usersList"
            enrollmentGroup={this.props.enrollmentGroup}
            currentUser={this.props.currentUser}
          />
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

const ExpandableEnrollmentGroupsList = React.createClass({
  propTypes: {
    enrollmentGroups: EnrollmentGroupsState.Types.many.isRequired
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
    const allSelected = ListComponentState.Store.allEnrollmentGroupsAreSelected();
    this.setState({ allSelected });
  },
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.allSelected !== nextState.allSelected) return true;
    return false;
  },
  toggleSelectedEnrollmentGroups(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (this.state.allSelected) {
      // Select none
      ListComponentState.ActionCreators.setSelectedForManyEnrollmentGroups(
        this.props.enrollmentGroups,
        false
      );
    } else {
      // Select all
      ListComponentState.ActionCreators.setSelectedForManyEnrollmentGroups(
        this.props.enrollmentGroups,
        true
      );
    }
  },
  render() {
    const selectText = this.state.allSelected ? 'Select None' : 'Select All';
    return (
      <div>
        <button className="ui basic button" onClick={this.toggleSelectedEnrollmentGroups}>
          {selectText}
        </button>
        <div className="ui selection list" style={etlStyle}>
          {this.props.enrollmentGroups
            .map(enrollmentGroup => (
              <EnrollmentGroupListItem
                className="item"
                key={enrollmentGroup.get('id')}
                enrollmentGroup={enrollmentGroup}
                currentUser={this.props.currentUser}
              />
            ))
            .toJSON()}
        </div>
      </div>
    );
  }
});

export const EnrollmentGroupsList = React.createClass({
  propTypes: {
    enrollmentGroups: EnrollmentGroupsState.Types.many
  },
  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={{
            enrollmentGroups: this.props.enrollmentGroups,
            currentUser: this.props.currentUser
          }}
          createComponent={props => (
            <ExpandableEnrollmentGroupsList
              enrollmentGroups={props.enrollmentGroups}
              currentUser={props.currentUser}
            />
          )}
          noDataText="There are no enrollment groups available."
        />
      </div>
    );
  }
});
