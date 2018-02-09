import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import _ from 'lodash';
import Radium from 'radium';
import { t } from 'i18n';
import Select from 'react-select';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import ModulesState from 'state/modules';
import PageState from '../../content-management/lessons-tab/page-state';

import createPaginatedStateContainer from 'state/pagination';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer, NoData } from 'components/common/loading';
import { LessonCard } from 'components/common/lesson-card';

import Style from 'style';

const styles = {
  countSortingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchCount: {
    display: 'inline-block',
    margin: 0
  },
  sorting: {
    width: 114,
    border: 'none',
    cursor: 'pointer',
    height: 20,
    container: {
      display: 'inline-block'
    }
  },
  inactiveContainer: {
    height: 0
  },
  inactive: {
    position: 'relative',
    top: 0,
    display: 'inline-block',
    padding: '6px 20px 7px 10px',
    backgroundColor: 'rgba(236, 21, 21, 0.72)',
    color: '#fff',
    borderBottomRightRadius: 27,
    margin: 20,
    zIndex: 1
  }
};

export class LessonsResultsPage extends React.Component {
  static data = {
    lesson: {
      required: false,
      fields: [
        'name',
        'id',
        'created',
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
    }
  };
  static contextTypes = {
    currentUser: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired
  };

  componentWillUpdate() {
    if (PageState.Store.getLessonSearch() !== this.props.searchQuery) {
      PageState.ActionCreators.onSetLessonSearch(this.props.searchQuery);
    }
  }

  onClickLessonCard = (inactive, lesson) => {
    if (inactive) {
      this.context.router.push(resolve('lesson-management', {
        lessonId: lesson.get('id')
      }));
    } else {
      this.context.router.push(resolve('new-module-attempt', {
        moduleId: lesson.get('id'),
        trainingPlanId: lesson.get('most_relevant_training_plan_for_current_user').id
      }));
    }
  };

  render() {
    const SORTING_OPTIONS = [
      { value: '-search_rank', label: t('relevance') },
      { value: 'name', label: t('name_az') },
      { value: '-name', label: t('name_za') },
      { value: '-created', label: t('newest') },
      { value: 'created', label: t('oldest') }
    ];
    const learner = this.context.currentUser.get('learner');
    return (
      <div>
        <LoadingContainer
          loadingProps={{
            lessons: this.props.lessons
          }}
          createComponent={props => (
            <div>
              <div style={styles.countSortingContainer}>
                <Select
                  style={styles.sorting}
                  options={SORTING_OPTIONS}
                  placeholder={<div>{t('sort_by')}</div>}
                  arrowRenderer={({ isOpen }) => (
                    <i
                      className="ui icon sort content descending"
                      style={{ color: isOpen ? 'black' : 'grey' }}
                    />
                  )}
                  clearable={false}
                  valueRenderer={o => <div>{o.label}</div>}
                  searchable={false}
                  onChange={v => PageState.ActionCreators.setLessonOrder(v.value)}
                  value={PageState.Store.getLessonOrder()}
                />
              </div>
              <InfiniteScroll
                loadMore={this.props.loadMore}
                moreDataAvailable={this.props.moreDataAvailable}
                isLoading={this.props.isLoading}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {this.props.lessons.map(lesson => {
                    const plan =
                      lesson.get('training_plans').length === 0
                        ? null
                        : lesson.get('training_plans')[0];
                    // checks that the lesson is not part of a deactivated plan or an unpublished plan
                    const inactive =
                      plan === null ||
                      lesson.get('most_relevant_training_plan_for_current_user') === null;
                    const icon = inactive ? 'write' : 'play';
                    const inactiveText = plan === null ? t('archived') : t('unpublished');
                    return (
                      <div>
                        {inactive && (
                          <div style={styles.inactiveContainer}>
                            <div style={styles.inactive}>{inactiveText}</div>
                          </div>
                        )}
                        <LessonCard
                          key={lesson.get('id')}
                          module={lesson}
                          icon={icon}
                          onClick={() => {
                            this.onClickLessonCard(inactive, lesson);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </InfiniteScroll>
            </div>
          )}
          createNoDataComponent={() => (
            <NoData style={{ padding: 20 }}>{t('no_search_results')}</NoData>
          )}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(LessonsResultsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, ModulesState.Store],

  paginate: {
    store: ModulesState.Store,
    propName: 'lessons',
    limit: 24,
    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(this.context.currentUser);
      const search = PageState.Store.getLessonSearch();
      const ordering = PageState.Store.getLessonOrder();
      const learner = this.context.currentUser.get('learner');
      const query = _.extend({
        limit: 24,
        fields: [
          'created_by',
          'created_by.learner',
          'created_by.learner.learner_group',
          'created_by.learner.is_learner_group_admin',
          'most_relevant_training_plan_for_current_user',
          'training_plans',
          'training_plans.user_is_enrolled',
          $y.getFields(LessonsResultsPage, 'lesson')
        ],
        is_attemptable: true,
        deactivated__is_null: true,
        viewable_by_user: this.context.currentUser.get('id'),
        search,
        ...(ordering ? { ordering } : { ordering: '-search_rank' })
      });
      return query;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, LessonsResultsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, LessonsResultsPage, errors);
  }
});
