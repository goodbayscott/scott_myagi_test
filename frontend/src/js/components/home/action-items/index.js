import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import ActionItemsState from 'state/action-items';

import { styles as commonStyles, constants as commonConstants } from '../common';

import Sticky from 'react-sticky-el';
import { LoadingContainer, NoData } from 'components/common/loading';

import CompletedItems from './completed-items';
import ItemList from './item-list';

const styles = {
  container: {
    ...commonStyles.sidePanel,
    [Style.vars.media.get('mobile')]: {
      flex: 1,
      width: '100%',
      marginRight: 0,
      marginLeft: 0,
      marginTop: 10,
      marginBottom: 10
    }
  },
  innerContainer: {
    ...commonStyles.sidePanelInner
  },
  heading: {
    ...commonStyles.panelHeading,
    marginBottom: 0
  },
  noData: {
    marginTop: 20,
    marginBottom: 20
  },
  completedButton: {
    cursor: 'pointer',
    textAlign: 'center',
    padding: 20,
    fontSize: 12,
    color: Style.vars.colors.get('xDarkGrey'),
    ...Style.funcs.makeTransitionAll(),
    ':hover': {
      color: Style.vars.colors.get('textBlack')
    }
  }
};

@Radium
class ViewCompletedButton extends React.Component {
  render() {
    const count = this.props.completedCount;
    return (
      <div style={styles.completedButton} onClick={() => this.modal.show()}>
        {count === 1 ? t('view_one_completed_item') : t('view_count_completed_items', { count })}
        <CompletedItems ref={el => (this.modal = el)} />
      </div>
    );
  }
}

@Radium
class ActionItems extends React.Component {
  renderInner() {
    return (
      <div style={styles.innerContainer}>
        <p style={styles.heading}>{t('action_items')}</p>
        <LoadingContainer
          loadingProps={[this.props.items]}
          createComponent={() => (
            // Need to filter items because cached items which have just been completed
            // may still show on this list
            <ItemList items={this.props.items.filter(i => !i.get('completed'))} />
          )}
          createNoDataComponent={standardStyling => (
            <NoData style={{ ...standardStyling, ...styles.noData }}>{t('no_action_items')}</NoData>
          )}
        />
        {this.props.completedCount && this.props.completedCount > 0 ? (
          <ViewCompletedButton completedCount={this.props.completedCount} />
        ) : null}
      </div>
    );
  }
  render() {
    return (
      <div style={styles.container}>
        {/* Action items are stacked above the feed on mobile, in which case we don't want to use
        a sticky element */}
        {window.innerWidth > commonConstants.stickyWidth ? (
          <Sticky>{this.renderInner()}</Sticky>
        ) : (
          <div>{this.renderInner()}</div>
        )}
      </div>
    );
  }
}

export default Marty.createContainer(ActionItems, {
  listenTo: [ActionItemsState.Store],

  componentWillUnmount() {
    // Reset entirely because when action items become completed,
    // they don't always get removed from the local cache.
    // Do this on unmount as unfortunately componentWillMount gets called after
    // data fetch is made.
    ActionItemsState.ActionCreators.resetLocalData();
  },

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  fetch: {
    items() {
      return ActionItemsState.Store.getItems({
        completed__isnull: true,
        deactivated__isnull: true,
        limit: 20
      });
    },
    completedCount() {
      const q = {
        completed__isnull: false,
        deactivated__isnull: true,
        limit: 1
      };
      ActionItemsState.Store.getItems(q);
      return ActionItemsState.Store.getKnownCountForQuery(q);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ActionItems);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ActionItems, errors);
  }
});
