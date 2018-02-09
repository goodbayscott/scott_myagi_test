import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import { resolve } from 'react-router-named-routes';

import containerUtils from 'utilities/containers';
import Style from 'style';
import $y from 'utilities/yaler';

import ModuleTrainingPlansState from 'state/module-training-plans';
import TrainingPlansState from 'state/training-plans';

import { Modal } from 'components/common/modal';

import { LoadingContainer } from 'components/common/loading';
import { EditPlanModal } from 'components/training/plans/edit-plan-modal';
import { LessonCard } from 'components/common/lesson-card';

const modalStyle = {
  addModuleHeader: {
    overflow: 'visible',
    paddingBottom: '1.2em !important',
    display: 'inline-block',
    width: '100%'
  },
  modulesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }
};

@Radium
export class TrainingPlanModal extends React.Component {
  static data = {
    moduleTrainingPlans: {
      required: true,
      fields: [$y.getFields(LessonCard, 'module', 'module')]
    },
    channels: $y.getData(EditPlanModal, 'channels', { required: false })
  };

  static propTypes = $y.propTypesFromData(TrainingPlanModal, {
    attemptable: React.PropTypes.bool
  });

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      currentModule: null
    };
  }

  show = () => {
    this.refs.modal.show();
  };

  hide = () => {
    if (!this.refs.modal) return;
    this.refs.modal.hide();
  };

  setCurrentModule = module => {
    this.setState({ currentModule: module });
  };

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps !== nextState;
  }

  attemptModule = module => {
    this.hide();
    const params = this.props.goToChannelOnCompletion
      ? `?goToChannelOnCompletion=${this.props.goToChannelOnCompletion}`
      : '';
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: module.get('id'),
      trainingPlanId: this.props.trainingPlan.get('id')
    }) + params);
  };

  render() {
    const { trainingPlan, moduleTrainingPlans } = this.props;

    return (
      <Modal size="large" ref="modal" header={`${trainingPlan && trainingPlan.get('name')}`}>
        <div className="content">
          <LoadingContainer
            loadingProps={[moduleTrainingPlans]}
            noDataText="This plan has no lessons."
            createComponent={() => (
              <div style={modalStyle.modulesContainer}>
                {moduleTrainingPlans.map(mtp => {
                  const module = Im.Map(mtp.get('module'));
                  return (
                    <LessonCard
                      key={module.get('id')}
                      module={module}
                      onClick={() => this.attemptModule(module)}
                    />
                  );
                })}
              </div>
            )}
          />
        </div>
      </Modal>
    );
  }
}

export const ViewTrainingPlanModal = Marty.createContainer(TrainingPlanModal, {
  listenTo: [TrainingPlansState.Store, ModuleTrainingPlansState.Store],

  fetch: {
    moduleTrainingPlans() {
      if (this.props.trainingPlan) {
        return ModuleTrainingPlansState.Store.getItems({
          ordering: 'order,module__name',
          training_plan: this.props.trainingPlan.get('id'),
          module_is_attemptable: true,
          module__deactivated__isnull: true,
          limit: 0,
          fields: ['order', $y.getFields(TrainingPlanModal, 'moduleTrainingPlans')]
        });
      }
      return null;
    }
  },

  show() {
    this.refs.innerComponent.show();
  },

  pending() {
    return containerUtils.defaultPending(this, TrainingPlanModal);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPlanModal, errors);
  }
});
