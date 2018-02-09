import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import {
  Item,
  ItemMainImage,
  ItemInfoContainer,
  PlanHeading,
  PlanSubHeading,
  ItemAction,
  ItemMainHeading,
  ItemContentContainer
} from './common';

const styles = {};

export default class NextPlanItem extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  onClick = () => {
    const plan = this.props.item.get('plan');
    this.context.router.push(resolve('new-module-attempt', {
      trainingPlanId: plan.get('id'),
      moduleId: plan.get('next_incompleted_module_for_user')
    }));
  };
  render() {
    const plan = this.props.item.get('plan');
    const isFirst = this.props.item.get('is_first_for_user');
    return (
      <div>
        <Item item={this.props.item} onClick={this.onClick}>
          <ItemMainHeading>
            {isFirst ? t('complete_your_first_plan') : t('complete_your_next_plan')}
          </ItemMainHeading>
          <ItemContentContainer>
            <ItemMainImage src={plan.get('thumbnail_url')} />
            <ItemInfoContainer>
              <PlanHeading>{plan.get('name')}</PlanHeading>
              <PlanSubHeading>{plan.get('owner').get('company_name')}</PlanSubHeading>
            </ItemInfoContainer>
            <ItemAction />
          </ItemContentContainer>
        </Item>
      </div>
    );
  }
}
