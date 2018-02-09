import React from 'react';
import Style from 'style/index.js';
import Im from 'immutable';
import Marty from 'marty';
import ChannelsState from 'state/channels';
import containerUtils from 'utilities/containers.js';
import TrainingPlansState from 'state/training-plans';
import { AddTrainingPlansModal } from '../add-training-plans-modal';
import { PlanCard } from 'components/content-management/plans-tab/plan-card';
import { t } from 'i18n';
import { Modal } from 'components/common/modal/index';
import { LoadingContainer, NoData } from 'components/common/loading';
import { PrimaryButton } from 'components/common/buttons';
import { FullWidthSegment } from 'components/common/box';
import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';
import { resolve } from 'react-router-named-routes';

import {
  SortableElement,
  SortableContainer,
  arrayMove,
  ReorderButton
} from 'components/common/ordering';

const styles = {
  segment: {
    padding: '20px 10px 0 10px',
    minHeight: '16em',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column'
  },
  plansContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  buttonContainer: {
    height: 30,
    marginTop: -20
  }
};

@SortableElement
class TrainingPlanItem extends React.Component {
  static propTypes = {
    trainingPlan: React.PropTypes.instanceOf(Im.Map).isRequired,
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  onRemoveIconClick = evt => {
    evt.stopPropagation();
    this.refs.archiveModal.show();
  };
  getDropdownItems() {
    const items = [];
    if (!this.props.isExternalChannel) {
      items.push({
        label: 'Edit plan',
        action: this.editPlan
      });
      items.push({
        label: 'Remove from channel',
        action: this.showRemoveFromChannelModal
      });
    }
    return items;
  }
  doArchive = () => {
    TrainingPlanTrainingUnitsState.ActionCreators.doListAction(
      'delete_for_plan_and_training_unit',
      {
        training_plan: this.props.trainingPlan.get('url'),
        training_unit: this.props.channel.get('url')
      }
    );
  };
  viewPlan = () => {
    this.context.router.push(resolve('plan-management', {
      planId: this.props.trainingPlan.get('id')
    }));
  };
  showRemoveFromChannelModal = () => {
    this.refs.archiveModal.show();
  };
  editPlan = () => {
    this.context.router.push(resolve('plan-management', {
      planId: this.props.trainingPlan.get('id')
    }));
  };
  render() {
    const badgesWithTp = this.props.trainingPlan.get('badges');
    let archiveConfirmText;
    if (badgesWithTp.length) {
      archiveConfirmText = t('remove_last_badge');
    } else {
      // TODO
      archiveConfirmText = `This will permanently remove the "${this.props.trainingPlan.get('name')}" plan from this channel.`;
    }

    return (
      <div>
        <PlanCard
          key={this.props.trainingPlan.get('id')}
          trainingPlan={this.props.trainingPlan}
          dropdownItems={this.getDropdownItems()}
          currentUser={this.props.currentUser}
          channels={Im.List([this.props.channel])}
          showTrainingPlanDetails={this.viewPlan}
          highlight={this.props.reorderEnabled}
          addPadding
        />
        <Modal
          header="Remove from channel"
          content={archiveConfirmText}
          onConfirm={this.doArchive}
          ref="archiveModal"
          basic
        />
      </div>
    );
  }
}

@SortableContainer
class TrainingPlansCollection extends React.Component {
  static propTypes = {
    trainingPlans: React.PropTypes.instanceOf(Im.List).isRequired,
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    return (
      <div style={styles.plansContainer}>
        {this.props.trainingPlans.map((plan, idx) => (
          <TrainingPlanItem
            key={plan.get('id')}
            index={idx}
            trainingPlan={plan}
            channel={this.props.channel}
            currentUser={this.props.currentUser}
            reorderEnabled={this.props.reorderEnabled}
            isExternalChannel={this.props.isExternalChannel}
          />
        ))}
      </div>
    );
  }
}

class TrainingPlansTabInner extends React.Component {
  constructor(props) {
    super();
    this.state = {
      sortedTrainingPlanTrainingUnits: props.trainingPlanTrainingUnits
    };
  }

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.trainingPlanTrainingUnits && !this.state.reorderEnabled) {
      if (
        !this.state.sortedTrainingPlanTrainingUnits ||
        nextProps.trainingPlanTrainingUnits.count() !==
          this.state.sortedTrainingPlanTrainingUnits.count()
      ) {
        this.setState({
          sortedTrainingPlanTrainingUnits: nextProps.trainingPlanTrainingUnits
        });
      }
    }
  }
  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      sortedTrainingPlanTrainingUnits: Im.List(arrayMove(this.state.sortedTrainingPlanTrainingUnits.toArray(), oldIndex, newIndex))
    });
    _.defer(this.saveSorting);
  };

  showAddTrainingPlansModal = () => {
    this.refs.addTrainingPlansModal.show();
  };

  saveSorting = () => {
    this.state.sortedTrainingPlanTrainingUnits.map((mtp, idx) => {
      if (mtp.get('order') !== idx) {
        TrainingPlanTrainingUnitsState.ActionCreators.update(mtp.get('id'), {
          order: idx
        });
      }
    });
  };

  toggleReorder = () => {
    this.setState({ reorderEnabled: !this.state.reorderEnabled });
  };
  render() {
    let nonAddedPlans;
    if (this.props.allTrainingPlans && this.props.trainingPlanTrainingUnits) {
      nonAddedPlans = this.props.allTrainingPlans.filter(plan =>
        this.props.trainingPlanTrainingUnits.find(addedTptu => addedTptu.get('training_plan').id === plan.get('id')) === undefined);
    }
    return (
      <FullWidthSegment style={styles.segment}>
        {!this.props.isExternalChannel && (
          <div style={styles.buttonContainer}>
            <ReorderButton
              reorderEnabled={this.state.reorderEnabled}
              toggleReorder={this.toggleReorder}
              containerStyle={{ float: 'right' }}
              entity="plans"
            />
            <PrimaryButton onClick={this.showAddTrainingPlansModal} floatRight>
              {t('add_plans')}
            </PrimaryButton>
          </div>
        )}
        <LoadingContainer
          loadingProps={{
            trainingPlanTrainingUnits: this.state.sortedTrainingPlanTrainingUnits,
            channel: this.props.channel
          }}
          createComponent={props => (
            <TrainingPlansCollection
              {...props}
              trainingPlans={this.state.sortedTrainingPlanTrainingUnits.map(tptu =>
                Im.Map(tptu.get('training_plan')))}
              axis="xy"
              onSortEnd={this.onSortEnd}
              shouldCancelStart={() => !this.state.reorderEnabled}
              reorderEnabled={this.state.reorderEnabled}
              currentUser={this.context.currentUser}
              isExternalChannel={this.props.isExternalChannel}
            />
          )}
          shouldRenderNoData={props => !this.state.sortedTrainingPlanTrainingUnits.count()}
          createNoDataComponent={standardStyling => (
            <NoData style={{ clear: 'both' }}>
              <span style={{ cursor: 'pointer' }} onClick={this.showAddTrainingPlansModal}>
                {`${t('no_plans_available_add_some')}`}
              </span>{' '}
            </NoData>
          )}
        />
        <AddTrainingPlansModal
          ref="addTrainingPlansModal"
          currentUser={this.context.currentUser}
          trainingPlans={nonAddedPlans}
          channel={this.props.channel || Im.Map()}
          showCreatePlan
        />
      </FullWidthSegment>
    );
  }
}

export const TrainingPlansTab = Marty.createContainer(TrainingPlansTabInner, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [ChannelsState.Store, TrainingPlansState.Store],
  fetch: {
    allTrainingPlans() {
      const query = {
        owner: this.context.currentUser.get('learner').company.id,
        ordering: 'name',
        fields: ['id', 'name', 'url'],
        limit: 0
      };

      return TrainingPlansState.Store.getItems(query, {
        // Wait for channel updates before refetching data
        dependantOn: ChannelsState.Store
      });
    }
  },
  pending() {
    return containerUtils.defaultPending(this, TrainingPlansTabInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPlansTabInner, errors);
  }
});
