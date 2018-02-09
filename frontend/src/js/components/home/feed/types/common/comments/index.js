import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import Radium from 'radium';
import { resolve } from 'react-router-named-routes';

import { t } from 'i18n';

import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import createPaginatedStateContainer from 'state/pagination';
import CommentsState from 'state/comments';
import ComponentState from './state';

import Style from 'style';

import { AvatarImage } from 'components/common/avatar-images';
import { Form, TextInput, SubmitButton } from 'components/common/form';
import { SendButton } from '../../../common';

const AVATAR_SIZE = '2.5em';

const styles = {
  container: {
    padding: 10,
    border: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  addCommentContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  userPic: {
    marginBottom: 0,
    cursor: 'pointer'
  },
  userPicContainer: {
    marginRight: 10
  },
  userName: {
    cursor: 'pointer'
  },
  form: { flex: 1, display: 'flex', flexDirection: 'row' },
  textInput: { borderColor: 'transparent', container: { marginBottom: 0, flex: 1 } },
  submitBtn: {
    ...Style.funcs.makeTransform('translateX(calc(-100% - 5px))'),
    ...Style.funcs.makeTransitionAll(),
    marginTop: 10,
    color: Style.vars.colors.get('xDarkGrey'),
    cursor: 'pointer'
  },
  submitBtnValid: {
    color: Style.vars.colors.get('textBlack')
  },
  commentContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  commentDetailsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column'
  },
  commentTime: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  viewMoreBtn: {
    marginBottom: 20,
    color: Style.vars.colors.get('xDarkGrey'),
    textAlign: 'center',
    cursor: 'pointer',
    ...Style.funcs.makeTransitionAll(),
    ':hover': {
      color: Style.vars.colors.get('textBlack')
    }
  }
};

function getCommentFetchQuery(activity) {
  const object = activity.get('object');
  const q = {
    activity: object.get('id'),
    fields: $y.getFields(Comments, 'comments'),
    ordering: '-id'
  };
  return q;
}

class AddComment extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor() {
    super();
    this.state = {
      hasVal: false,
      submitCount: 0
    };
  }

  onInputChange = (evt, val) => {
    if (val && val.length) this.setState({ hasVal: true });
    else this.setState({ hasVal: false });
  };

  onSubmit = data => {
    data.activity = this.props.activity.get('object').get('id');
    data.user = this.context.currentUser.get('url');
    CommentsState.ActionCreators.create(data, {
      disableClearRecentFetches: true
    }).then(() => {
      const q = getCommentFetchQuery(this.props.activity);
      // TODO - This won't work when pagination is set up
      q.limit = this.props.commentLimit;
      CommentsState.ActionCreators.clearRecentFetchesForQuery(q);
    });
    this.setState({ submitCount: this.state.submitCount + 1, hasVal: false });
  };

  render() {
    return (
      <div style={styles.addCommentContainer}>
        <div style={styles.userPicContainer}>
          <AvatarImage style={styles.userPic} size={AVATAR_SIZE} user={this.context.currentUser} />
        </div>
        <Form
          onSubmitAndValid={this.onSubmit}
          style={styles.form}
          ref={el => (this.form = el)}
          key={this.state.submitCount}
        >
          <TextInput
            style={styles.textInput}
            name="body"
            placeholder="Write a comment..."
            required
            onChange={this.onInputChange}
            hideErrorMessage
            actionComponent={
              <SendButton isValid={this.state.hasVal} onClick={() => this.form.onSubmit()} />
            }
          />
        </Form>
      </div>
    );
  }
}

class Comment extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  };
  goToUser = () => {
    this.context.router.push(resolve('profile', { userId: this.props.comment.get('user').id }));
  };
  render() {
    const user = this.props.comment.get('user');
    return (
      <div style={styles.commentContainer}>
        <div style={styles.userPicContainer}>
          <AvatarImage
            style={styles.userPic}
            size={AVATAR_SIZE}
            user={Im.Map(user)}
            onClick={this.goToUser}
          />
        </div>
        <div style={styles.commentDetailsContainer}>
          <div>
            <b onClick={this.goToUser} style={styles.userName}>
              {user.first_name} {user.last_name}
            </b>{' '}
            {this.props.comment.get('body')}
          </div>
          <div style={styles.commentTime}>
            {moment
              .utc(this.props.comment.get('created'))
              .local()
              .fromNow()}
          </div>
        </div>
      </div>
    );
  }
}

@Radium
class ViewMoreButton extends React.Component {
  render() {
    return (
      <div style={styles.viewMoreBtn} onClick={this.props.onClick}>
        {this.props.count === 1
          ? t('view_one_more_comment')
          : t('view_num_more_comments', { num: this.props.count })}
      </div>
    );
  }
}

class Comments extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static data = {
    comments: {
      many: true,
      fields: ['id', 'url', 'body', 'created', 'user.id', $y.getFields(AvatarImage, 'user', 'user')]
    }
  };

  viewAll = () => {
    ComponentState.ActionCreators.setLimit(this.props.activity.get('id'), 0);
  };

  renderViewMore() {
    const extraCount = this.props.count - this.props.comments.count();
    if (extraCount <= 0) return null;
    return <ViewMoreButton onClick={this.viewAll} count={extraCount} />;
  }

  renderComments() {
    return (
      <div>
        {this.props.comments
          .reverse()
          .map(c => <Comment key={c.get('id')} comment={c} />)
          .toJS()}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        {this.props.count > 0 && this.renderViewMore()}
        {this.props.comments && this.renderComments()}
        <AddComment activity={this.props.activity} commentLimit={this.props.commentLimit} />
      </div>
    );
  }
}

export default Marty.createContainer(Comments, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [CommentsState.Store, ComponentState.Store],

  fetch: {
    commentLimit() {
      return ComponentState.Store.getLimit(this.props.activity.get('id'));
    },
    count() {
      const q = getCommentFetchQuery(this.props.activity);
      q.limit = ComponentState.Store.getLimit(this.props.activity.get('id'));
      return CommentsState.Store.getKnownCountForQuery(q);
    },
    comments() {
      const q = getCommentFetchQuery(this.props.activity);
      q.limit = ComponentState.Store.getLimit(this.props.activity.get('id'));
      return CommentsState.Store.getItems(q);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Comments);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Comments, errors);
  }
});
