import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Radium from 'radium';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import UserTimelineState from 'state/user-timeline';

import { LoadingContainer, NoData } from 'components/common/loading';

import { BackButton } from 'components/common/buttons';

import { TYPE_TO_COMPONENT } from '../types';

const styles = {
  outerContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    backgroundColor: Style.vars.colors.get('lightGrey')
  },
  innerContainer: {
    marginTop: 12,
    width: '100%',
    maxWidth: Style.vars.widths.get('contentFeedMaxWidth')
  },
  backButton: {
    marginBottom: 10
  }
};

@Radium
class SingleActivityItem extends React.Component {
  static data = {};
  render() {
    const { activityGroup } = this.props;
    return (
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <BackButton style={styles.backButton} routeName="home">
            {t('home')}
          </BackButton>
          <LoadingContainer
            loadingProps={[activityGroup]}
            createComponent={() => {
              const Component = TYPE_TO_COMPONENT[activityGroup.get('verb')];
              if (!Component) {
                throw new Error(`Could not find Component for ${activityGroup.get('verb')}`);
              }
              return (
                <Component
                  currentUser={this.props.currentUser}
                  activityGroup={Im.fromJS(activityGroup.toJS())}
                  loadAllComments
                />
              );
            }}
            createNoDataComponent={standardStyling => (
              <NoData style={{ ...standardStyling, ...styles.noData }}>{t('no_activity')}</NoData>
            )}
          />
        </div>
      </div>
    );
  }
}

export default Marty.createContainer(SingleActivityItem, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [UserTimelineState.Store],

  componentWillUnmount() {
    // Reset entirely because otherwise main home feed page
    // will display duplicated activity item.
    UserTimelineState.ActionCreators.resetLocalData();
  },

  fetch: {
    activityGroup() {
      return UserTimelineState.Store.getItem(this.context.routeParams.activityId);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, SingleActivityItem);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, SingleActivityItem, errors);
  }
});
