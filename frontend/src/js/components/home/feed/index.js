import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Radium from 'radium';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import UserTimeline from 'state/user-timeline';

import { styles as commonStyles, constants as commonConstants } from '../common';

import { LoadingContainer, NoData } from 'components/common/loading';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { PrimaryButton } from 'components/common/buttons';
import CreatePostForm from './create-post';
import InitialFeedItem from './initial-feed-item';

import { TYPE_TO_COMPONENT } from './types';

const FEED_LIMIT = 10;

const styles = {
  container: {
    flex: 2,
    maxWidth: Style.vars.widths.get('contentFeedMaxWidth'),
    ...commonStyles.topBrandedBorder,
    [commonConstants.statPanelHideScreenSize]: {
      // Creates a little bit of padding on right hand side of feed
      marginRight: 20
    },
    [Style.vars.media.get('mobile')]: {
      flex: 1,
      width: '100%',
      marginRight: 0,
      borderTop: 'none'
    }
  },

  headingContainer: {
    backgroundColor: 'white',
    marginTop: 0,
    marginLeft: 0,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 10,
    width: '100%'
  },

  headingContainerWithCreatePost: {
    marginBottom: 10
  },

  heading: {
    ...commonStyles.panelHeading,
    padding: 0,
    marginLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 7
  },

  headingWithCreatePost: {
    marginBottom: 15
  },

  spinnerContainer: {
    backgroundColor: 'white',
    height: 300
  },

  noData: {
    backgroundColor: 'white',
    padding: '30px 0',
    color: Style.vars.colors.get('textBlack')
  }
};

@Radium
class ActivityFeed extends React.Component {
  static data = {};
  refreshData = () => {
    this.props.resetPagination();
    UserTimeline.ActionCreators.resetLocalData();
    // UserTimeline.ActionCreators.clearRecentFetches();
  };
  render() {
    const {
      activityGroups, dataIsLoading, moreDataAvailable, loadMore
    } = this.props;
    const canPost = this.props.currentUser.get('learner').can_manage_training_content;
    return (
      <div style={styles.container}>
        <div style={[styles.headingContainer, canPost && styles.headingContainerWithCreatePost]}>
          <p style={[styles.heading, canPost && styles.headingWithCreatePost]}>{t('feed')}</p>
          {canPost && <CreatePostForm refreshData={this.refreshData} />}
        </div>
        <LoadingContainer
          loadingProps={[activityGroups]}
          spinnerProps={{ containerStyle: styles.spinnerContainer }}
          createComponent={() => (
            <InfiniteScroll
              dataIsLoading={dataIsLoading}
              moreDataAvailable={moreDataAvailable}
              loadMore={loadMore}
            >
              {activityGroups.map(group => {
                const Component = TYPE_TO_COMPONENT[group.get('verb')];
                if (!Component) {
                  throw new Error(`Could not find Component for ${group.get('verb')}`);
                }
                return (
                  <Component
                    currentUser={this.props.currentUser}
                    activityGroup={Im.fromJS(group.toJS())}
                    key={group.get('id')}
                  />
                );
              })}
              {/* Show this initial feed item until company has enough activity in their account */}
              {activityGroups.count() < FEED_LIMIT && <InitialFeedItem />}
            </InfiniteScroll>
          )}
          createNoDataComponent={_ => <InitialFeedItem />}
        />
      </div>
    );
  }
}

export default createPaginatedStateContainer(ActivityFeed, {
  listenTo: [UserTimeline.Store],

  componentWillUnmount() {
    // Reset entirely because activity doesn't always update properly.
    // Do this on unmount as unfortunately componentWillMount gets called after
    // data fetch is made.
    UserTimeline.ActionCreators.resetLocalData();
  },

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  paginate: {
    store: UserTimeline.Store,
    propName: 'activityGroups',
    limit: FEED_LIMIT,
    getQuery() {
      return {};
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ActivityFeed);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ActivityFeed, errors);
  }
});
