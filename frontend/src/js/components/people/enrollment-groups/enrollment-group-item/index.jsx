import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import pluralize from 'pluralize';

import EnrollmentGroupsState from 'state/enrollment-groups';
import Style from 'style/index';

import $y from 'utilities/yaler';
import { Modal } from 'components/common/modal';

import { Title, Description, ListItem, CornerRemoveIcon } from 'components/common/list-items';
import { AvatarImage } from 'components/common/avatar-images';

const MAX_IMAGES = 8;

export class EnrollmentGroupItem extends React.Component {
  static data = {
    enrollmentGroup: {
      fields: ['name', 'id', 'url', 'members', 'num_viewable_users']
    }
  };

  static propTypes = $y.propTypesFromData(EnrollmentGroupItem, {});

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  navigateToEnrollmentGroup = () => {
    this.context.router.push(resolve('enrollment-groups', { enrollmentGroupId: this.props.enrollmentGroup.get('id') }));
  };

  showDeleteEnrollmentGroupModal = evt => {
    evt.stopPropagation();
    this.refs.delModal.show();
  };

  deleteEnrollmentGroup = () => {
    EnrollmentGroupsState.ActionCreators.delete(this.props.enrollmentGroup.get('id'));
    this.refs.delModal.hide();
  };

  render() {
    let delIcon;
    const membersCount = this.props.enrollmentGroup.get('num_viewable_users');
    // // Only allow deletion if user is company admin
    let currentUser;
    if (this.props.currentUser) currentUser = this.props.currentUser;
    if (this.context.currentUser) currentUser = this.context.currentUser;
    if (currentUser && currentUser.get('learner').is_company_admin) {
      delIcon = <CornerRemoveIcon onClick={this.showDeleteEnrollmentGroupModal} />;
    }
    const manager = this.props.enrollmentGroup.get('manager');
    return (
      <ListItem onClick={this.navigateToEnrollmentGroup}>
        {delIcon}
        <div className="ui stackable two column grid">
          <div className="ui column">
            <Title>{this.props.enrollmentGroup.get('name')}</Title>
            <Description>
              {membersCount} {pluralize('members', membersCount)}
            </Description>
          </div>
          <div className="ui column">
            {manager ? <AvatarImage style={{ float: 'right' }} user={Im.Map(manager)} /> : null}
          </div>
        </div>
        <Modal
          ref="delModal"
          header="Are you sure you want to delete this group?"
          content="This action cannot be reversed."
          onConfirm={this.deleteEnrollmentGroup}
          basic
        />
      </ListItem>
    );
  }
}
