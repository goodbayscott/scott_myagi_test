import React from 'react';
import { t } from 'i18n';
import { Link } from 'react-router';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import TrainingPageUtils from 'utilities/component-helpers/training-page';

import createPaginatedStateContainer from 'state/pagination';

import ModulesState from 'state/modules';

import { HeaderWithLineThrough } from 'components/common/box';
import { LoadingContainer, NoData } from 'components/common/loading';
import { SecondaryButton } from 'components/common/buttons';
import { LessonCard } from 'components/common/lesson-card';
import ModuleCards from './module-cards';

const NUM_TODAY_MODULES = 5;

const styles = {
  container: {
    marginBottom: 40,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  pageHeading: {
    fontWeight: 200,
    fontSize: '2rem',
    marginBottom: 15,
    marginTop: 20
  },
  pageCounter: {
    color: Style.vars.colors.get('xDarkGrey'),
    marginBottom: 10
  },
  pageCounterComplete: {
    color: Style.vars.colors.get('oliveGreen')
  },
  moreBtn: {
    padding: '10px 22px',
    backgroundColor: 'rba(0,0,0,0)',
    border: '1px solid rgba(0,0,0,0)',
    display: 'inline-block',
    ':hover': {
      border: '1px solid #aaa',
      transform: 'scale(1.1)'
    }
  }
};

class Page extends React.Component {
  static data = {
    modules: $y.getData(ModuleCards, 'modules')
  };

  modulesForTodayCompletedCount() {
    const mods = this.props.modules;
    if (!mods) return 0;
    return mods.take(NUM_TODAY_MODULES).count(TrainingPageUtils.moduleWasCompletedByCurrentUser);
  }

  numForTodayCount() {
    const mods = this.props.modules;
    if (!mods) return 0;
    return mods.take(NUM_TODAY_MODULES).count();
  }

  render() {
    const { modules, currentUser } = this.props;

    const doneForToday = this.modulesForTodayCompletedCount() >= this.numForTodayCount();
    const numForToday = this.numForTodayCount();

    let noDataEl;
    if (currentUser.get('learner').can_make_new_channel_connections) {
      noDataEl = (
        <NoData>
          <Link to={{ pathname: '/views/content/', query: { tab: 'find_content' } }}>
            {t('completed_all_lessons_access_more')}
          </Link>
        </NoData>
      );
    } else {
      noDataEl = <NoData>{t('completed_all_lessons_ask_manager')}</NoData>;
    }

    return (
      <div style={styles.container}>
        <div style={styles.pageHeading}>{t('todays_lessons')}</div>
        {modules &&
          numForToday > 0 && (
            <div style={[styles.pageCounter, doneForToday ? styles.pageCounterComplete : null]}>
              {`${this.modulesForTodayCompletedCount()} / ${numForToday} ${t('complete')}`}
            </div>
          )}
        <LoadingContainer
          loadingProps={[modules]}
          createNoDataComponent={() => noDataEl}
          createComponent={() => {
            const forToday = modules.take(NUM_TODAY_MODULES);
            const rest = modules.skip(NUM_TODAY_MODULES);
            const hasRest = rest.count() > 0;
            return (
              <div>
                <ModuleCards {...this.props} modules={forToday} passNextForToday />
                {hasRest && <HeaderWithLineThrough>{t('more_lessons')}</HeaderWithLineThrough>}
                {hasRest && <ModuleCards {...this.props} modules={rest} />}
              </div>
            );
          }}
        />
        {modules &&
          this.props.moreDataAvailable && (
            <SecondaryButton style={styles.moreBtn} onClick={this.props.loadMore}>
              {this.props.dataIsLoading ? t('loading_with_dots') : t('more')}
            </SecondaryButton>
          )}
      </div>
    );
  }
}

export const TodayTabContent = createPaginatedStateContainer(Page, {
  paginate: {
    store: ModulesState.Store,
    propName: 'modules',
    limit: NUM_TODAY_MODULES,
    getQuery() {
      const id = this.props.currentUser.get('id');
      return {
        order_by_relevance_for_user: id,
        viewable_by_user: id,
        is_attemptable: true,
        fields: [...$y.getFields(Page, 'modules'), ...$y.getFields(LessonCard, 'module')]
      };
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
