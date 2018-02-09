import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';
import pluralize from 'pluralize';

import AreasState from 'state/areas';
import $y from 'utilities/yaler';

import { Modal } from 'components/common/modal';
import { Title, Description, ListItem, CornerRemoveIcon } from 'components/common/list-items';
import { AvatarImage } from 'components/common/avatar-images';

export class AreaItem extends React.Component {
  static data = {
    area: {
      fields: [
        'name',
        'learnergroup_set',
        'managers.id',
        'managers.first_name',
        'managers.last_name',
        'managers.learner.profile_photo'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(AreaItem, {});

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  navigateToArea = () => {
    this.context.router.push(resolve('area', { areaId: this.props.area.get('id') }));
  };

  showDeleteAreaModal = evt => {
    evt.stopPropagation();
    this.refs.delModal.show();
  };

  deleteArea = () => {
    AreasState.ActionCreators.delete(this.props.area.get('id')).catch(err => {
      this.context.displayTempNegativeMessage({
        heading: 'Unable to delete area',
        body: 'You may only delete areas that do not contain any teams'
      });
    });
    this.refs.delModal.hide();
  };

  getManagerAvatars = () => {
    const managers = this.props.area.get('managers');
    if (!managers.length) return null;
    const avatars = [];
    managers.forEach(manager => {
      avatars.push(<AvatarImage key={manager.id} style={{ float: 'right' }} user={Im.Map(manager)} />);
    });
    return avatars;
  };

  render() {
    const teamsCount = this.props.area.get('learnergroup_set').length;
    const delIcon = <CornerRemoveIcon onClick={this.showDeleteAreaModal} />;

    return (
      <ListItem onClick={this.navigateToArea}>
        {delIcon}
        <div className="ui stackable two column grid">
          <div className="ui column">
            <Title>{this.props.area.get('name')}</Title>
            <Description>
              {teamsCount} {pluralize('teams', teamsCount)}
            </Description>
          </div>
          <div className="ui column">{this.getManagerAvatars()}</div>
        </div>
        <Modal
          ref="delModal"
          header={t('are_you_sure_delete_area')}
          content={t('this_action_cannot_be_reversed')}
          onConfirm={this.deleteArea}
          basic
        />
      </ListItem>
    );
  }
}
