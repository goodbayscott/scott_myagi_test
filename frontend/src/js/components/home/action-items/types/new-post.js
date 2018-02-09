import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import ActionItemsState from 'state/action-items';

import { truncateText } from 'utilities/generic';

import {
  Item,
  ItemMainImage,
  ItemInfoContainer,
  ItemAction,
  ItemMainHeading,
  ItemContentContainer
} from './common';

const SUMMARY_LEN = 16;

const styles = {};

export default class NewPostItem extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  onClick = () => {
    this.context.router.push(resolve('single-activity-item', {
      activityId: this.props.item.get('activity').get('stream_activity_id')
    }));
    ActionItemsState.ActionCreators.doDetailAction(this.props.item.get('id'), 'complete_now');
  };
  render() {
    const activity = this.props.item.get('activity');
    const summary = truncateText(this.props.item.get('activity').get('body'), SUMMARY_LEN);
    return (
      <div>
        <Item item={this.props.item} onClick={this.onClick}>
          <ItemMainHeading>{t('view_post')}</ItemMainHeading>
          <ItemContentContainer>
            <ItemInfoContainer noImage>
              {t('view_post_from', {
                firstName: activity.get('user').get('first_name'),
                lastName: activity.get('user').get('last_name'),
                postSummary: summary
              })}
            </ItemInfoContainer>
            <ItemAction />
          </ItemContentContainer>
        </Item>
      </div>
    );
  }
}
