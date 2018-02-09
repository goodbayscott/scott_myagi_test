import React from 'react';
import _ from 'lodash';
import { t } from 'i18n';

import ModuleTrainingPlansState from 'state/module-training-plans';

import { Modal } from 'components/common/modal';
import { getIdFromApiUrl } from 'utilities/generic';

import { Form, SubmitButton, FieldHeader } from 'components/common/form';
import { ModuleCardSelect } from 'components/common/card-searchable-select';

class SelectModuleModalContent extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  onFormSubmit = data => {
    const modules = data.modules;
    const trainingPlan = this.props.trainingPlan;
    // add the training plan to all selected modules.
    _.forEach(modules, module => {
      const moduleId = getIdFromApiUrl(module);
      // let the module select component handle finding available modules.
      const availableModules = this.refs.form.refs.moduleSelection.getSelectedEntitiesArray();
      const moduleObj = availableModules.find(item => item.get('url') == module);
      const currentTrainingPlans = moduleObj.get('training_plans');
      const newTrainingPlans = currentTrainingPlans;
      if (!_.includes(currentTrainingPlans, trainingPlan.get('url'))) {
        ModuleTrainingPlansState.ActionCreators.create({
          module: moduleObj.get('url'),
          training_plan: trainingPlan.get('url'),
          order: 0
        });
      }
    });
    this.context.displayTempPositiveMessage({
      heading: 'Success',
      body: 'Lessons added to plan'
    });
    this.props.onModuleUpdate();
  };

  render() {
    const planModules = this.props.trainingPlan.get('modules');
    const initModuleURLS = planModules.map(item => item.url);
    const initModuleIds = planModules.map(item => item.id);
    const fetchOpts = {
      belongs_to_user_company: this.props.currentUser.get('id'),
      editable_by_user: this.props.currentUser.get('id')
    };
    if (initModuleIds.length) {
      // exclude modules that are already in current training plan
      _.extend(fetchOpts, { exclude__id__in: initModuleIds });
    }

    return (
      <div>
        <Form ref="form" onSubmitAndValid={this.onFormSubmit}>
          <ModuleCardSelect
            name="modules"
            onChange={this.props.onModuleSelectChange}
            ref="moduleSelection"
            currentUser={this.props.currentUser}
            hide={this.props.hide}
            plan={this.props.trainingPlan}
            fetchOpts={fetchOpts}
            required
            many
          />
          <SubmitButton onSubmit={_.noop} text={t('add_lessons_to_plan')} />
        </Form>
      </div>
    );
  }
}

export class AddExistingLessonModal extends React.Component {
  show = () => {
    _.defer(() => this.refs.modal.show());
  };

  hide = () => {
    this.refs.modal.hide();
  };

  onModuleUpdate = () => {
    _.defer(() => {
      this.hide();
      if (this.props.onModuleUpdate) {
        this.props.onModuleUpdate();
      }
    });
  };

  render() {
    const {
      trainingPlan, onModuleSelectChange, currentUser, createNewModule
    } = this.props;
    return (
      <Modal
        ref="modal"
        header={t('add_lessons_to_the_name_plan', { name: trainingPlan.get('name') })}
        size="large"
        closeOnDimmerClick
        scrolling
      >
        <div>
          {trainingPlan && (
            <SelectModuleModalContent
              {...this.props}
              onChange={onModuleSelectChange}
              hide={this.props.hide}
              currentUser={currentUser}
              createNewModule={createNewModule}
              onModuleUpdate={this.onModuleUpdate}
            />
          )}
        </div>
      </Modal>
    );
  }
}
