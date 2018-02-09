import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';

import t from 'i18n';

import Style from 'style';

import { ANALYTICS_EVENTS } from 'core/constants';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { isMobileWidth } from 'utilities/generic';

import ActionItemsState from 'state/action-items';

import { FilterSet, FilterItem } from 'components/common/filter-set';
import CoverPhoto from './cover-photo';
import ActionItems from './action-items';
import ActivityFeed from './feed';
import StatsPanel from './stats-panel';

const FEED = 'feed';
const ACTION_ITEMS = 'action_items';

const styles = {
  container: {
    backgroundColor: Style.vars.colors.get('lightGrey'),
    minHeight: '100vh'
  },
  innerContainer: {
    width: '100%',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    margin: '-100px auto 0 auto',
    position: 'relative',
    flexDirection: 'row',
    [Style.vars.media.get('mobile')]: {
      marginTop: 0,
      flexDirection: 'column'
    }
  },
  divider: { width: '100%' },
  filterSet: {
    width: '100%',
    display: 'flex',
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 5,
    paddingRight: 5
  },
  filterBtn: {
    flex: 1,
    textAlign: 'center'
  }
};

@Radium
export class HomePage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      curFilter: FEED
    };
  }

  setFilter = filter => {
    this.setState({ curFilter: filter });
  };

  renderDesktop() {
    return (
      <div style={styles.container}>
        <CoverPhoto user={this.props.currentUser} edit />
        <div style={styles.innerContainer}>
          <ActionItems currentUser={this.props.currentUser} />
          <ActivityFeed currentUser={this.props.currentUser} />
          <StatsPanel currentUser={this.props.currentUser} />
        </div>
      </div>
    );
  }

  renderMobile() {
    return (
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <FilterSet
            filterNames={[FEED, ACTION_ITEMS]}
            setFilter={this.setFilter}
            containerStyle={styles.filterSet}
            createButton={defaultProps => (
              <FilterItem
                {...defaultProps}
                style={styles.filterBtn}
                showIndicator={
                  defaultProps.filterName === ACTION_ITEMS &&
                  this.props.items &&
                  this.props.items.count()
                }
              />
            )}
          />
          {this.state.curFilter === FEED ? (
            <ActivityFeed currentUser={this.props.currentUser} noHeading />
          ) : (
            <ActionItems currentUser={this.props.currentUser} noHeading />
          )}
        </div>
      </div>
    );
  }

  render() {
    return isMobileWidth() ? this.renderMobile() : this.renderDesktop();
  }
}

export default Marty.createContainer(HomePage, {
  listenTo: [ActionItemsState.Store],
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  },

  componentDidMount() {
    if (this.context.currentUser && !this.context.currentUser.get('learner').company) {
      // redirect to join or create company if user has no company
      this.context.router.push(resolve('join-or-create-company'));
    }
  },

  fetch: {
    items() {
      // Just used to determine whether or not to show indicator on activity items filter
      return ActionItemsState.Store.getItems({
        completed__isnull: true,
        deactivated__isnull: true,
        limit: 1
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, HomePage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, HomePage, errors);
  }
});
