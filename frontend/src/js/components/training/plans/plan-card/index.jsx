import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';

import { t } from 'i18n';
import $y from 'utilities/yaler';
import Style from 'style';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { Modal } from 'components/common/modal';
import { TrainingPlanCardDetails } from './card';
import { EditPlanModal } from '../edit-plan-modal';

export class TrainingPlanCard extends React.Component {
  static data = {
    trainingPlan: {
      required: true,
      fields: [
        'id',
        'url',
        'modules.id',
        'modules.url',
        'modules.successfully_completed_by_current_user',
        'owner.url',
        'owner.company_name',
        'user_is_enrolled',
        'owner',
        'owner.company_logo',
        $y.getFields(TrainingPlanCardDetails, 'trainingPlan'),
        $y.getFields(EditPlanModal, 'trainingPlan')
      ]
    },
    channels: $y.getData(EditPlanModal, 'channels')
  };

  static propTypes = $y.propTypesFromData(TrainingPlanCard, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false;
    _.each(this.props, (val, key) => {
      if (nextProps[key] !== val) {
        shouldUpdate = true;
      }
    });
    return shouldUpdate;
  }

  continuePlan = () => {
    const nextModule = this.props.trainingPlan.get('next_module');
    if (!nextModule) {
      this.showNoModulesWarning();
      return;
    }

    this.context.router.push(resolve('new-module-attempt', {
      moduleId: nextModule.id,
      trainingPlanId: this.props.trainingPlan.get('id')
    }));
  };

  showNoModulesWarning = () => {
    this.refs.noModulesWarningModal.show();
  };

  showPlanDetails = () => {
    if (this.props.isPublicPage && this.props.onPlanCardClick) {
      this.props.onPlanCardClick();
    }
  };

  render() {
    return (
      <div>
        <TrainingPlanCardDetails
          {...this.props}
          showTrainingPlanDetails={this.showPlanDetails}
          linkTo={this.props.linkTo}
          hoverIcon={this.props.hoverIcon}
          lock={this.props.lock}
        />
        <Modal ref="noModulesWarningModal" header={t('this_plan_has_no_lessons')} basic message>
          <div className="content">{t('lessons_must_be_added')}</div>
        </Modal>
      </div>
    );
  }
}

export class TrainingPlansCollection extends React.Component {
  static data = {
    trainingPlans: {
      many: true,
      required: true,
      fields: ['id']
    }
  };

  static propTypes = $y.propTypesFromData(TrainingPlansCollection, {
    loadMore: React.PropTypes.func.isRequired,
    moreAvailable: React.PropTypes.func.isRequired,
    isLoading: React.PropTypes.func.isRequired,
    enrollModeEnabled: React.PropTypes.bool,
    createCard: React.PropTypes.func.isRequired,
    requireSequentialCompletion: React.PropTypes.bool
  });

  planIsComplete(tp) {
    return _.all(_.map(tp.get('modules'), m => m.successfully_completed_by_current_user));
  }

  render() {
    // Init with -1 so that first plan is auto-unlocked
    let lastComplete = -1;
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreAvailable={this.props.moreAvailable}
        isLoading={this.props.isLoading}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {this.props.trainingPlans.map((tp, idx) => {
            const isComplete = this.planIsComplete(tp);
            if (isComplete) lastComplete = idx;
            // Only unlock the "next" plan (i.e. the first plan or next incomplete plan)
            const shouldLock = idx > lastComplete + 1 && this.props.requireSequentialCompletion;
            return this.props.createCard(tp, shouldLock);
          })}
        </div>
      </InfiniteScroll>
    );
  }
}
