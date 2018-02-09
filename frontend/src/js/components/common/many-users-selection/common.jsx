import Marty from 'marty';
import React from 'react';
import cx from 'classnames';

import Style from 'style';

import containerUtils from 'utilities/containers';

import UsersState from 'state/users';
import TeamsState from 'state/teams';
import ListComponentState from './component-state';

import { LoadingContainer } from 'components/common/loading';

const uliStyle = {
  container: {
    padding: '1em',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  }
};

class UserListItem extends React.Component {
  static propTypes = {
    user: UsersState.Types.one.isRequired
  };
  constructor(props) {
    super(props);
    this.state = {
      isSelected: ListComponentState.Store.isSelectedUser(props.user)
    };
  }

  componentDidMount = () => {
    this.state.listener = ListComponentState.Store.addChangeListener(this.onStoreChange);
  };

  componentWillUnmount = () => {
    this.state.listener.dispose();
  };

  onStoreChange = () => {
    const isSelectedUser = ListComponentState.Store.isSelectedUser(this.props.user);
    this.setState({ isSelected: isSelectedUser });
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    if (this.state.isSelected !== nextState.isSelected) return true;
    return false;
  };

  toggleSelected = evt => {
    evt.stopPropagation();
    ListComponentState.ActionCreators.toggleUserSelected(this.props.user);
  };

  render() {
    const isSelectedUser = this.state.isSelected;
    const iconClasses = cx(
      'left',
      'floated',
      { green: isSelectedUser },
      { checkmark: isSelectedUser },
      { minus: !isSelectedUser },
      { square: !isSelectedUser },
      'icon'
    );
    return (
      <div className="item" onClick={this.toggleSelected} style={uliStyle.container}>
        <i className={iconClasses} />
        <div className=" left floated content">
          <div className="header">{this.props.user.get('full_name')}</div>
        </div>
      </div>
    );
  }
}

const ulStyle = {
  container: {}
};

export class UsersList extends React.Component {
  static propTypes = {
    users: UsersState.Types.many,
    onLoad: React.PropTypes.func
  };

  render() {
    return (
      <div style={Style.funcs.merge(ulStyle.container, this.props.style)}>
        <LoadingContainer
          loadingProps={{
            users: this.props.users
          }}
          spinnerProps={{
            containerStyle: {
              backgroundColor: 'transparent'
            }
          }}
          createComponent={props => (
            <div className="ui selection list">
              {props.users.map(user => <UserListItem user={user} key={user.get('id')} />).toJS()}
            </div>
          )}
          noDataText="There are no users in this team."
        />
      </div>
    );
  }
}

export const UsersListContainer = Marty.createContainer(UsersList, {
  propTypes: {
    team: TeamsState.Types.one.isRequired
  },
  listenTo: [UsersState.Store, ListComponentState.Store],
  fetch: {
    users() {
      if (this.props.team) {
        return ListComponentState.Store.getUsersForTeam(this.props.team);
      }
      if (this.props.enrollmentGroup) {
        return ListComponentState.Store.getUsersForEnrollmentGroup(
          this.props.enrollmentGroup,
          this.props.currentUser
        );
      }
    }
  },
  pending() {
    return containerUtils.defaultPending(this, UsersList);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, UsersList, errors);
  }
});
