import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import $y from 'utilities/yaler';
import { t } from 'i18n';
import { momentToISO } from 'utilities/time';

import CompaniesState from 'state/companies';
import TrainingPlansState from 'state/training-plans';
import ModulesState from 'state/modules';
import ModuleTrainingPlansState from 'state/module-training-plans';

import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { AddExistingLessonModal } from './add-existing-lesson-modal';
import { AddNewLessonModal } from './add-new-lesson-modal';
import { AddLessonModal } from './add-lesson-modal';
import { SortableLessonCard } from 'components/content-management/lessons-tab/lesson-card';
import { LoadingContainer } from 'components/common/loading';
import { SortableContainer, arrayMove, ReorderButton } from 'components/common/ordering';

import containerUtils from 'utilities/containers';

const styles = {
  planDetailsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignContent: 'flex-start'
  },
  addLessonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  addLessonBtn: {
    float: 'right'
  },
  addLessonCard: {
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  sortableContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: '0 -20px'
  }
};

@SortableContainer
export class LessonCardCollection extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  addLessonToPlan = () => {
    this.props.addLessonToPlan();
  };

  hideModal = () => {
    this.refs.selectLessonModal.hide();
  };

  removeConfirmClick = lesson => {
    ModuleTrainingPlansState.ActionCreators.doListAction('delete_for_module_and_plan', {
      module: lesson.get('url'),
      training_plan: this.props.plan.get('url')
    }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    });
  };

  archiveConfirmClick = lesson => {
    if (lesson.get('deactivated') !== null) return;
    const now = momentToISO(moment());
    ModulesState.ActionCreators.update(lesson.get('id'), { deactivated: now }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Lesson archived'
      });
    });
  };

  render() {
    return (
      <div style={styles.planDetailsContainer}>
        <div style={{ width: '100%' }}>
          <div style={styles.sortableContainer}>
            {this.props.lessons.map((module, idx) => (
              <SortableLessonCard
                key={module.get('id')}
                index={idx}
                lesson={Im.Map(module)}
                highlight={this.props.reorderEnabled}
                currentUser={this.props.currentUser}
                plan={Im.Map(this.props.plan)}
                onTransition={_.noop}
                archiveConfirmClick={this.archiveConfirmClick}
                removeConfirmClick={this.removeConfirmClick}
                editable={!this.props.reorderEnabled}
                showArchive={this.props.showArchive}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export class LessonsContainer extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      sortedModuleTrainingPlans: props.moduleTrainingPlans,
      reorderEnabled: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.moduleTrainingPlans && !this.state.reorderEnabled) {
      if (
        !this.state.sortedModuleTrainingPlans ||
        nextProps.moduleTrainingPlans !== this.state.sortedModuleTrainingPlans
      ) {
        this.setState({
          sortedModuleTrainingPlans: nextProps.moduleTrainingPlans
        });
      }
    }
    // Forcing a refetch here to ensure state reflects changes in Module
    ModuleTrainingPlansState.ActionCreators.resetLocalData();
  }

  addLessonToPlan = () => {
    // If company doesn't have any lessons, no need to show addOrCreateLessonModal
    const hasContent = this.props.currentUser.get('learner').company.has_content;
    if (hasContent) {
      this.refs.addOrCreateLessonModal.show();
    } else {
      this.refs.newLessonModal.show();
    }
  };

  createNewLesson = () => {
    this.refs.addOrCreateLessonModal.hide();
    this.refs.newLessonModal.show();
  };

  addExistingLesson = () => {
    this.refs.addOrCreateLessonModal.hide();
    this.refs.selectLessonModal.show();
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      sortedModuleTrainingPlans: Im.List(arrayMove(this.state.sortedModuleTrainingPlans.toArray(), oldIndex, newIndex))
    });
    _.defer(this.saveSorting);
  };

  saveSorting = () => {
    this.state.sortedModuleTrainingPlans.map((mtp, idx) => {
      if (mtp.get('order') !== idx) {
        ModuleTrainingPlansState.ActionCreators.update(mtp.get('id'), {
          order: idx
        });
      }
    });
  };

  toggleReorder = () => {
    this.setState({ reorderEnabled: !this.state.reorderEnabled });
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    const hasContent = learner.company.has_content;
    const { showArchivedLessons } = this.props;
    return (
      <div>
        {this.props.userCanEditPlan && (
          <div style={styles.addLessonContainer}>
            {this.props.moduleTrainingPlans &&
              this.props.moduleTrainingPlans.size > 1 && (
                <ReorderButton
                  reorderEnabled={this.state.reorderEnabled}
                  toggleReorder={this.toggleReorder}
                  entity="lessons"
                />
              )}
            {hasContent && (
              <SecondaryButton onClick={this.props.showArchive}>
                <i className="ui icon archive" />
                {showArchivedLessons ? t('hide_archived') : t('view_archived')}
              </SecondaryButton>
            )}
            <PrimaryButton onClick={this.addLessonToPlan} style={styles.addLessonBtn}>
              <i className="add circle icon" />
              {t('add_lesson')}
            </PrimaryButton>
          </div>
        )}
        <LoadingContainer
          loadingProps={[this.state.sortedModuleTrainingPlans]}
          createComponent={props => (
            <LessonCardCollection
              {...this.props}
              onSortEnd={this.onSortEnd}
              shouldCancelStart={() => !this.state.reorderEnabled}
              reorderEnabled={this.state.reorderEnabled}
              axis="xy"
              lessons={this.state.sortedModuleTrainingPlans.map(mtp => Im.Map(mtp.get('module')))}
              currentPage={this.props.currentPage}
              numAvailablePages={this.props.numAvailablePages}
              goToPage={this.props.goToPage}
              addLessonToPlan={this.addLessonToPlan}
            />
          )}
          createNoDataComponent={props => (
            <div style={styles.planDetailsContainer}>
              {/* TODO: Translations */}
              <span style={{ fontSize: 15, paddingTop: 25, paddingBottom: 25 }}>
                {showArchivedLessons
                  ? t('there_are_no_archived_lessons')
                  : 'Create your first lesson for this plan. Lessons can consist of videos, PDFs, web pages and quizzes.'}
              </span>
              {!showArchivedLessons && (
                <div>
                  {this.props.userCanEditPlan ? (
                    <div>
                      &nbsp;
                      <u style={{ cursor: 'pointer' }} onClick={this.addLessonToPlan} />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        />

        <AddLessonModal
          ref="addOrCreateLessonModal"
          createNewLesson={this.createNewLesson}
          addExistingLesson={this.addExistingLesson}
          plan={this.props.plan}
        />

        <AddNewLessonModal
          ref="newLessonModal"
          plan={this.props.plan}
          currentUser={this.props.currentUser}
        />

        <AddExistingLessonModal
          trainingPlan={this.props.plan}
          ref="selectLessonModal"
          hide={this.hideModal}
          currentUser={this.props.currentUser}
          createNewModule={this.createNewModule}
          onModuleUpdate={this.hideModal}
        />
      </div>
    );
  }
}

export const LessonSection = Marty.createContainer(LessonsContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [
    TrainingPlansState.Store,
    CompaniesState.Store,
    ModulesState.Store,
    ModuleTrainingPlansState.Store
  ],
  fetch: {
    moduleTrainingPlans() {
      const query = {
        limit: 0,
        ordering: 'order,module__name',
        training_plan: this.props.plan.get('id'),
        module_is_attemptable: true,
        module__deactivated__isnull: true,
        fields: ['order', $y.getFields(SortableLessonCard, 'lesson', 'module')]
      };
      if (this.props.showArchivedLessons) {
        delete query.ordering;
        delete query.module_is_attemptable;
        query.module__deactivated__isnull = false;
      }
      return ModuleTrainingPlansState.Store.getItems(query, { dependantOn: ModulesState.Store });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, LessonsContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, LessonsContainer, errors);
  }
});
