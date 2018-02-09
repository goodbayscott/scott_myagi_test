import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Radium from 'radium';

import Style from 'style/index.js';
import containerUtils from 'utilities/containers.js';
import $y from 'utilities/yaler';
import { t } from 'i18n';
import { LoadingContainer } from 'components/common/loading';

import ChannelsState from 'state/channels';
import TrainingPlansState from 'state/training-plans';
import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';
import ChannelShareRequestsState from 'state/channel-share-requests';
import ChannelSharesState from 'state/channel-shares';
import UsersState from 'state/users';
import BadgesState from 'state/badges';

import { ChannelDetailsForm } from '../common/channel-details-form';

import { RouterTabs } from 'components/common/router-tabs';
import { Panel } from 'components/common/box.jsx';
import { PlanCard } from 'components/content-management/plans-tab/plan-card';

import { ButtonsRow } from './buttons-row';
import { ChannelPageCoverImage } from './cover-image';

const styles = {
  outerStyle: {
    padding: '0px 10px 0 10px'
  },
  tabsContainer: {
    padding: '5px 10px',
    background: Style.vars.colors.get('white'),
    marginLeft: '-10px',
    marginRight: '-10px'
  },
  defaultBackground: {
    backgroundColor: Style.vars.colors.get('white')
  },
  topRow: {
    display: 'flex',
    flexWrap: 'wrap-reverse',
    justifyContent: 'space-between',
    padding: 10
  }
};

@Radium
class ChannelPage extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  routerTabs = () => {
    const learner = this.context.currentUser.get('learner');
    const isExternalChannel = this.isExternalChannel();
    const urlBase = `/views/channels/${this.props.channel.get('id')}`;
    return [
      { name: t('plans'), to: `${urlBase}/plans/` },

      ...(!isExternalChannel
        ? [
          { name: t('details'), to: `${urlBase}/details/` },
          { name: t('company_connections'), to: `${urlBase}/connections/` }
        ]
        : []),
      ...(isExternalChannel && this.props.channel.get('price')
        ? [{ name: t('licences'), to: `${urlBase}/licences/` }]
        : [])
    ];
  };

  isExternalChannel = () =>
    this.props.channel &&
    this.context.currentUser.get('learner').company.id != this.props.channel.get('company').id;

  getOwnCompanyConnection = () => (this.props.ownCompanyConnection.size ? this.props.ownCompanyConnection.first() : null);

  render() {
    const isExternalChannel = this.isExternalChannel();
    return (
      <div style={styles.defaultBackground}>
        {this.props.channel && (
          <ChannelPageCoverImage
            channel={this.props.channel}
            currentUser={this.props.currentUser}
            isExternalChannel={isExternalChannel}
          />
        )}
        <div style={styles.topRow}>
          <div style={styles.tabsContainer}>
            {this.props.channel &&
              this.routerTabs().length > 1 && <RouterTabs tabs={this.routerTabs()} />}
            <div style={Style.common.clearBoth} />
          </div>
          {this.props.channel &&
            this.props.ownCompanyConnection &&
            this.props.trainingPlanTrainingUnits && (
              <ButtonsRow
                isExternalChannel={isExternalChannel}
                channel={this.props.channel}
                trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
                ownCompanyConnection={this.getOwnCompanyConnection()}
              />
            )}
        </div>
        <LoadingContainer
          loadingProps={{
            channel: this.props.channel,
            trainingPlanTrainingUnits: this.props.trainingPlanTrainingUnits,
            ownCompanyConnection: this.props.ownCompanyConnection
          }}
          createComponent={props => (
            <Panel outerStyle={styles.outerStyle}>
              {React.cloneElement(this.props.children, {
                channel: this.props.channel,
                trainingPlanTrainingUnits: this.props.trainingPlanTrainingUnits,
                ownCompanyConnection: this.getOwnCompanyConnection(),
                isExternalChannel
              })}
            </Panel>
          )}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(ChannelPage, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [
    ChannelsState.Store,
    UsersState.Store,
    BadgesState.Store,
    TrainingPlanTrainingUnitsState.Store
  ],
  fetch: {
    channel() {
      return ChannelsState.Store.getItem(this.context.routeParams.channelId, {
        fields: [
          $y.getFields(ChannelDetailsForm, 'channel'),
          $y.getFields(ChannelPageCoverImage, 'channel'),
          'training_plans',
          'deactivated',
          'price',
          'total_licences_used_by_company',
          'learn_items',
          'reached_users_count',
          'subscribed_companies_count',
          'training_plans_count',
          'learner_group',
          'require_sequential_completion',
          'id'
        ]
      });
    },
    ownCompanyConnection() {
      // There should only be one connection for each training_unit & company
      // combination, but we don't have the id yet.
      return ChannelSharesState.Store.getItems({
        training_unit: this.context.routeParams.channelId,
        company: this.context.currentUser.get('learner').company.id,
        fields: [
          'id',
          'auto_add_plans_to_auto_enroll_set',
          'licence_quantity',
          'total_licences_used'
        ]
      });
    },
    trainingPlanTrainingUnits() {
      return TrainingPlanTrainingUnitsState.Store.getItems(
        {
          training_unit: this.context.routeParams.channelId,
          training_plan__deactivated__isnull: true,
          fields: [
            'id',
            'url',
            'order',
            'training_plan.name',
            'training_plan.owner.url',
            'training_plan.description',
            'training_plan.thumbnail_url',
            'training_plan.modules.id',
            'training_plan.modules.url',
            'training_plan.modules.name',
            'training_plan.modules.description',
            'training_plan.modules.thumbnail_url',
            'training_plan.badges.id',
            'training_plan.badges.name',
            'training_plan.badges.badge_image',
            $y.getFields(PlanCard, 'trainingPlan', 'training_plan')
          ],
          ordering: 'order,training_plan__name',
          limit: 0
        },
        {
          // Wait for channel updates before refetching data
          dependantOn: [ChannelsState.Store, BadgesState.Store]
        }
      );
    }
  },
  pending() {
    return containerUtils.defaultPending(this, ChannelPage);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelPage, errors);
  }
});
