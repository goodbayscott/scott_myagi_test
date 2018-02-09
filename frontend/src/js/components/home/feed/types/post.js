import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import PostActivitiesState from 'state/post-activities';

import { Dropdown } from 'components/common/dropdown';

import { ConfirmDeleteModal } from 'components/common/modal';

import EditPostModal from '../edit-post';

import { GroupSizeSwitch, Activity, BaseActivity, UserInfo, ExtraContentContainer } from './common';

const styles = {
  container: {
    marginTop: 15,
    marginBottom: 0,
    fontSize: 18,
    lineHeight: '24px'
  },
  dropdownContainer: {
    position: 'absolute',
    top: 5,
    right: 10
  },
  dropdownIcon: {
    color: Style.vars.colors.get('xDarkGrey')
  }
};

export default class PostActivity extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      // This component could be passed an activity group,
      // in which case there could be multiple posts which need
      // to be deleted separately.
      deleted: Im.List()
    };
  }
  startEdit = () => {
    this.editModal.show();
  };

  delete = act => {
    if (this.state.deleted.contains(act.get('id'))) return;
    PostActivitiesState.ActionCreators.delete(act.get('object').get('id'));
    this.setState({ deleted: this.state.deleted.push(act.get('id')) });
  };

  showDeleteConfirm = () => {
    this.deleteConfirm.show();
  };

  goToActivity = act => {
    this.context.router.push(resolve('single-activity-item', { activityId: act.get('id') }));
  };

  catchEvent = evt => {
    evt.stopPropagation();
    evt.preventDefault();
  };

  renderDropdown() {
    return (
      <div style={styles.dropdownContainer} onClick={this.catchEvent}>
        <Dropdown
          className="ui top right pointing dropdown"
          dropdownOpts={{
            action: 'hide'
          }}
          style={styles.dropdown}
        >
          <i className="dropdown icon" style={styles.dropdownIcon} />
          <div className="menu">
            <div className="item" onClick={this.startEdit}>
              {t('edit')}
            </div>
            <div className="item" onClick={this.showDeleteConfirm}>
              {t('delete')}
            </div>
          </div>
        </Dropdown>
      </div>
    );
  }

  renderDeleteConfirm(act) {
    return (
      <ConfirmDeleteModal ref={e => (this.deleteConfirm = e)} onConfirm={() => this.delete(act)} />
    );
  }

  renderEditPost(act) {
    return <EditPostModal ref={e => (this.editModal = e)} activity={act} />;
  }

  renderOne = activity => {
    const body = activity.get('object').get('body');
    const actor = activity.get('actor');
    const isCurUser = actor.get('id') === this.context.currentUser.get('id');
    if (this.state.deleted.contains(activity.get('id'))) return null;
    return (
      <BaseActivity activity={activity} onClick={() => this.goToActivity(activity)}>
        {isCurUser && this.renderDropdown()}
        <UserInfo user={actor} activityTime={activity.get('time')} />
        <ExtraContentContainer>
          <div style={styles.container}>{body}</div>
        </ExtraContentContainer>
        {this.renderDeleteConfirm(activity)}
        {this.renderEditPost(activity)}
      </BaseActivity>
    );
  };
  render() {
    return <GroupSizeSwitch activityGroup={this.props.activityGroup} renderOne={this.renderOne} />;
  }
}
