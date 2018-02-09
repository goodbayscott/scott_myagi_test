import React from 'react';
import { t } from 'i18n';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';

import $y from 'utilities/yaler';

import ModulesState from 'state/modules';
import { Modal } from 'components/common/modal';
import { SortableElement } from 'components/common/ordering';
import { LessonCard as LessonCardCommon } from 'components/common/lesson-card';

@Radium
export class LessonCard extends React.Component {
  /*
    A decent amount of this component has been copied from the training page component,
    but it differs enough to warrant a new component. TODO: get rid of the admin logic
    in the equivalent training page component.
  */

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static data = {
    lesson: {
      required: true,
      fields: [
        'name',
        'id',
        'thumbnail_url',
        'description',
        'url',
        'deactivated',
        'is_attemptable',
        'successfully_completed_by_current_user',
        'personal_best_score_for_user',
        'training_plans.id',
        'training_plans.name',
        'training_plans.owner'
      ]
    },
    trainingPlan: {
      fields: ['owner']
    }
  };

  static propTypes = $y.propTypesFromData(LessonCard, {
    onTransition: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  getPlan = () => {
    let plan = this.props.plan;
    if (!plan) plan = Im.Map(this.props.lesson.get('training_plans')[0]);
    return plan;
  };

  attemptLesson = () => {
    this.props.onTransition();
    const params = this.props.goToChannelOnCompletion
      ? `?goToChannelOnCompletion=${this.props.goToChannelOnCompletion}`
      : '';
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: this.props.lesson.get('id'),
      trainingPlanId: this.getPlan().get('id')
    }) + params);
  };

  showArchiveModal = () => {
    this.refs.archiveLessonModal.show();
  };

  showRemoveModal = () => {
    this.refs.removeLessonModal.show();
  };

  showRestoreLessonModal = () => {
    this.refs.restoreLessonModal.show();
  };

  restoreLessonConfirmClick = () => {
    ModulesState.ActionCreators.update(this.props.lesson.get('id'), {
      deactivated: null
    });
    this.refs.restoreLessonModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
    this.props.showArchive();
  };

  getDropdownItems() {
    const learner = this.props.currentUser.get('learner');
    const plan = this.getPlan();
    const lg =
      plan.get('training_units') && plan.get('training_units')[0]
        ? plan.get('training_units')[0].learner_group
        : null;
    const items = [];
    const deactivated = Boolean(this.props.lesson.get('deactivated'));
    if (deactivated) {
      items.push({
        label: 'Restore from archive',
        action: this.showRestoreLessonModal
      });
      return items;
    }
    items.push({
      label: 'Attempt',
      action: this.attemptLesson
    });
    if (
      plan.get('owner') &&
      (learner.can_manage_training_content ||
        (learner.is_learner_group_admin && lg === learner.learner_group)) &&
      learner.company.url === plan.get('owner').url &&
      this.props.editable
    ) {
      items.push({
        label: 'Archive',
        action: this.showArchiveModal
      });
    }
    if (
      this.props.lesson &&
      this.props.plan &&
      learner.can_manage_training_content &&
      learner.company.url === plan.get('owner').url &&
      this.props.editable &&
      this.props.lesson.get('training_plans') &&
      this.props.lesson.get('training_plans').length > 1
    ) {
      items.push({
        label: 'Remove from this plan',
        action: this.showRemoveModal
      });
    }
    return items;
  }

  editLesson = () => {
    this.context.router.push(resolve('lesson-management', {
      lessonId: this.props.lesson.get('id')
    }));
  };

  archiveConfirmClick = () => {
    this.refs.archiveLessonModal.hide();
    this.props.archiveConfirmClick(this.props.lesson);
  };

  removeConfirmClick = () => {
    this.refs.removeLessonModal.hide();
    this.props.removeConfirmClick(this.props.lesson);
  };

  render() {
    if (!this.getPlan().get('owner')) {
      // The only training plan has been deactivated
      return null;
    }
    const userCanManageTrainingContent = this.props.currentUser.get('learner')
      .can_manage_training_content;
    const userCompanyOwnsLesson =
      this.props.currentUser.get('learner').company.url === this.getPlan().get('owner').url;
    return (
      <div>
        <LessonCardCommon
          module={this.props.lesson}
          hideCompletionPercentage
          clickable={
            userCanManageTrainingContent &&
            userCompanyOwnsLesson &&
            !this.props.lesson.get('deactivated')
          }
          icon="write"
          onClick={this.editLesson}
          dropdownItems={this.getDropdownItems()}
          highlight={this.props.highlight}
        />
        <Modal
          ref="restoreLessonModal"
          onConfirm={this.restoreLessonConfirmClick}
          header={t('want_to_restore_lesson_from_archive')}
          basic
        />
        <Modal
          ref="archiveLessonModal"
          onConfirm={this.archiveConfirmClick}
          header={t('are_you_sure_archive_lesson')}
          basic
        />

        <Modal
          ref="removeLessonModal"
          onConfirm={this.removeConfirmClick}
          header={`Are you sure you want to remove the "${
            this.props.lesson ? this.props.lesson.get('name') : ''
          }" lesson from this plan?`}
          basic
        />
      </div>
    );
  }
}

export const SortableLessonCard = SortableElement(LessonCard);
SortableLessonCard.data = LessonCard.data;
