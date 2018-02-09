import React from 'react';
import ReactDOM from 'react-dom';
import Marty from 'marty';
import { resolve } from 'react-router-named-routes';
import Im from 'immutable';
import Radium from 'radium';
import _ from 'lodash';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import UsersState from 'state/users';

import { LoadingContainer } from 'components/common/loading';
import { AvatarImage } from 'components/common/avatar-images';
import FlipMove from 'react-flip-move';

const LB_OFFSET = 11;
const RANK_INCREASE = 3;

const styles = {
  container: {
    marginBottom: 80,
    borderTop: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  innerContainer: {
    maxWidth: 320,
    margin: '0 auto',
    paddingTop: 20,
    paddingBottom: 20
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  avatarImage: {
    marginBottom: 0,
    marginRight: 0
  },
  rank: {
    fontSize: 20
    // color: Style.vars.colors.get('xDarkGrey')
  },
  currentUserRow: {
    backgroundColor: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    zIndex: 99
  },
  rankIncreaseText: {
    marginLeft: 15,
    fontSize: 16
  }
};

@Radium
class AttemptSummaryLeaderboard extends React.Component {
  static data = {
    users: {
      fields: ['id', 'first_name', 'last_name', $y.getFields(AvatarImage, 'user')]
    }
  };
  constructor(props) {
    super();
    this.state = {
      userRank: null
    };
  }
  componentWillMount() {
    this.initRank(this.props);
  }
  componentWillReceiveProps(newProps) {
    if (!this.props.users) this.initRank(newProps);
  }
  initRank(newProps) {
    if (newProps.users) {
      this.setState({
        userRank: newProps.users.count() + 1
      });
      _.delay(this.changeRank, 0);
    }
  }
  changeRank = () => {
    if (this.state.userRank > 0) {
      this.setState({
        userRank: this.state.userRank - 1
      });
      _.delay(this.changeRank, 750);
    }
  };
  renderRow = (user, i) => {
    const isCurrent = user.id === this.props.currentUser.get('id');
    const rowStyle = isCurrent ? styles.currentUserRow : {};
    let rankIncrease = this.props.users.count() - this.state.userRank;
    if (rankIncrease < 0) {
      rankIncrease = 0;
    }
    return (
      <div key={user.id} className="ui grid" style={rowStyle}>
        <div className="ui four wide column" style={{ ...styles.column, ...styles.rank }}>
          <small>#</small>
          {i + LB_OFFSET}
        </div>
        <div className="ui three wide column" style={styles.column}>
          <AvatarImage size="2.5em" style={styles.avatarImage} user={Im.Map(user)} />
        </div>
        <div
          className="ui nine wide column"
          style={{ ...styles.column, justifyContent: 'flex-start' }}
        >
          {`${user.first_name} ${user.last_name}`}{' '}
          {isCurrent && <span style={styles.rankIncreaseText}>(+{rankIncrease})</span>}
        </div>
      </div>
    );
  };
  renderContent = () => {
    const users = this.props.users.toJS();
    users.splice(this.state.userRank, 0, this.props.currentUser.toJS());
    return (
      <div style={styles.innerContainer}>
        <FlipMove duration={750} easing="ease-out">
          {users.map(this.renderRow)}
        </FlipMove>
      </div>
    );
  };
  render() {
    return (
      <div style={styles.container}>
        <LoadingContainer loadingProps={[this.props.users]} createComponent={this.renderContent} />
      </div>
    );
  }
}

export default Marty.createContainer(AttemptSummaryLeaderboard, {
  listenTo: [UsersState.Store],
  fetch: {
    users() {
      return UsersState.Store.getItems({
        limit: 5,
        exclude_fake_users: true,
        exclude__id: this.props.currentUser.get('id'),
        // This will preference newly created accounts, which will usually be the accounts
        // of people in the meeting as opposed to the demo accounts (which are different to the fake
        // accounts)
        ordering: '-id',
        fields: $y.getFields(AttemptSummaryLeaderboard, 'users')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, AttemptSummaryLeaderboard);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, AttemptSummaryLeaderboard, errors);
  }
});
