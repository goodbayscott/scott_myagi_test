import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import moment from 'moment-timezone';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { styles as commonStyles } from '../../../common';

import { AvatarImage } from 'components/common/avatar-images';

import Comments from './comments';

const styles = {
  outerContainer: {
    marginBottom: 10
  },
  itemContainer: {
    // borderRadius: 5,
    backgroundColor: 'white',
    padding: 20,
    position: 'relative',
    ...Style.common.cardBorder,
    boxShadow: 'none'
  },
  clickable: {
    cursor: 'pointer'
  },
  itemContent: {
    fontSize: 18,
    textAlign: 'center',
    color: Style.vars.colors.get('xxDarkGrey')
  },
  imgContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  img: {
    width: '100%'
  },
  itemProfileInfoContainer: {
    display: 'flex'
  },
  itemProfilePic: {
    marginBottom: 0,
    cursor: 'pointer'
  },
  itemProfileInfo: {
    marginLeft: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  nameAndActivity: {
    marginBottom: 0
  },
  name: {
    cursor: 'pointer'
  },
  time: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  extraContentContainer: {},
  bottomTxtContainer: {
    color: Style.vars.colors.get('xDarkGrey')
  }
};

export class UserInfo extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  goToUser = e => {
    e.stopPropagation();
    e.preventDefault();
    this.context.router.push(resolve('profile', { userId: this.props.user.get('id') }));
  };
  render() {
    return (
      <div style={styles.itemProfileInfoContainer}>
        <AvatarImage
          style={styles.itemProfilePic}
          size="4em"
          user={this.props.user}
          onClick={this.goToUser}
        />
        <div style={styles.itemProfileInfo}>
          <p style={styles.nameAndActivity}>
            <b style={styles.name} onClick={this.goToUser}>
              {this.props.user.get('first_name')} {this.props.user.get('last_name')}
            </b>{' '}
            <span dangerouslySetInnerHTML={{ __html: this.props.activityTxt }} />
          </p>
          <p style={styles.time}>
            {moment
              .utc(this.props.activityTime)
              .local()
              .fromNow()}
          </p>
        </div>
      </div>
    );
  }
}

export class BaseActivityContainer extends React.Component {
  render() {
    const { children, onClick } = this.props;
    return (
      <div style={styles.outerContainer}>
        <div
          style={Style.funcs.mergeIf(onClick, styles.itemContainer, styles.clickable)}
          onClick={onClick}
        >
          {children}
        </div>
        {this.props.extraContent || <span />}
      </div>
    );
  }
}

export class BaseActivity extends React.Component {
  /*
  ** Use this if you need more flexibility than what the Activity component requires (e.g.
  ** you do not want to render auther info)
  */
  render() {
    const { activity, children, onClick } = this.props;
    return (
      <BaseActivityContainer
        onClick={onClick}
        extraContent={
          <Comments
            key={activity.get('object').get('id')}
            activity={activity}
            loadAllComments={this.props.loadAllComments}
          />
        }
      >
        {children}
      </BaseActivityContainer>
    );
  }
}

export class ExtraContentContainer extends React.Component {
  render() {
    return <div style={styles.extraContentContainer}>{this.props.children}</div>;
  }
}

export class Activity extends React.Component {
  render() {
    const {
      activity, children, onClick, activityTxt
    } = this.props;
    const actor = activity.get('actor');
    return (
      <BaseActivity onClick={onClick} activity={activity}>
        <UserInfo user={actor} activityTxt={activityTxt} activityTime={activity.get('time')} />
        <ExtraContentContainer>{children}</ExtraContentContainer>
      </BaseActivity>
    );
  }
}

export class SingleActorActivities extends React.Component {
  render() {
    const { activities, children, summaryTxt } = this.props;
    const firstActivity = activities.first();
    // Assumes only one actor is passed in. This should be ensured by the
    // aggregation rules setup in Stream.
    const actor = firstActivity.get('actor');
    return (
      <div style={styles.outerContainer}>
        <div style={styles.itemContainer}>
          <UserInfo
            user={actor}
            activityTxt={summaryTxt}
            activityTime={firstActivity.get('time')}
          />
          <ExtraContentContainer>{children}</ExtraContentContainer>
        </div>
      </div>
    );
  }
}

export function GroupSizeSwitch(props) {
  /*
    A simple wrapper component which takes an activity group and decides whether
    to render it as one item or many. At a minimum, you must pass a `renderOne`
    function OR a `renderMany` function, which will be used to render all the activities in the group.
    If only a `renderOne` function is used, then that will also be used for the many case. If only
    a `renderMany` function is used, then that will also be used for the single item case.
    This component allows you to just write one function or the other, then add the missing function
    at a later point without much effort.
  */
  const { activityGroup } = props;
  const acts = activityGroup.get('activities');
  if ((acts.count() > 1 && props.renderMany) || !props.renderOne) {
    return props.renderMany(acts);
  }
  return <span>{acts.map(act => <span key={act.get('id')}>{props.renderOne(act)}</span>)}</span>;
}
