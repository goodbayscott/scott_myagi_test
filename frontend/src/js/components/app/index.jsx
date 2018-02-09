import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Style from 'style';
import StyleCustomization from 'style/customization';
import moment from 'moment-timezone';
import { StyleRoot } from 'radium';

import containerUtils from 'utilities/containers';
import PubSub from 'utilities/pubsub';

import UsersState from 'state/users';
import AbstractNotificationsState from 'state/abstract-notifications';
import CompaniesState from 'state/companies';

import AppState from './state';

import { NavBar } from 'components/navbar';
import { TitleController } from './title-controller';
import { NotificationHandler } from './notification-handler';
import Announcement from './announcement';
import { TempMessages, NEGATIVE_MESSAGE, POSITIVE_MESSAGE } from './temp-messages';
import PoweredByMyagi from './powered-by';
import { TeamSelectionModal } from './team-selection-modal';
import { Page as SearchPage } from 'components/search/page';
import { NPSModal } from './nps';

import { DEFAULT_LANG } from 'i18n/constants';
import { configureForLocale } from 'i18n';

class AppInner extends React.Component {
  /*
    Container within which all pages view. Includes some
    useful context such as functions for displaying
    "flash" messages (i.e. temporary messages which dropdown
    from the top of the screen).
  */

  static contextTypes = {
    location: React.PropTypes.object
  };

  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map),
    loading: React.PropTypes.bool
  };

  static childContextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map)
  };

  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      windowWidth: window.innerWidth
    };
  }

  getChildContext() {
    return {
      displayTempPositiveMessage: this.displayTempPositiveMessage,
      displayTempNegativeMessage: this.displayTempNegativeMessage,
      displayGenericRequestFailureMessage: this.displayGenericRequestFailureMessage,
      currentUser: this.props.currentUser
    };
  }

  componentWillMount() {
    if (this.props.currentUser) {
      this.customizeForCurrentUser(this.props);
    }
  }

  componentWillUpdate(newProps) {
    if (newProps.currentUser !== this.props.currentUser) {
      this.customizeForCurrentUser(newProps);
    }
  }

  componentDidUpdate() {
    // Reset search bar settings
    const loc = this.props.location;
    if (loc) {
      if (loc.pathname !== this._prevPath) {
        this.resetSearch();
      }
      this._prevPath = loc.pathname;
    }

    // Set the company timezone if not already setState
    if (this.props.currentUser) {
      const co = this.props.currentUser.get('learner').company;
      if (co && !co.timezone && !this._setTimezone) {
        const guess = moment.tz.guess();
        if (guess) {
          CompaniesState.ActionCreators.doDetailAction(co.id, 'set_timezone', {
            timezone: guess
          });
        }
        this._setTimezone = true;
      }
    }
  }

  customizeForCurrentUser(props) {
    const curUser = props.currentUser;
    const co = curUser.get('learner').company;
    if (!co) return;
    StyleCustomization.setStylingForCompany(Im.Map(co));
    AppState.ActionCreators.setBaseTitle(`${co.company_name} on Myagi`);
  }

  displayTempPositiveMessage = opts => {
    this.tempMessagesComponent.displayMessage({
      ...opts,
      type: POSITIVE_MESSAGE
    });
  };

  displayTempNegativeMessage = opts => {
    this.tempMessagesComponent.displayMessage({
      ...opts,
      type: NEGATIVE_MESSAGE
    });
  };

  displayGenericRequestFailureMessage = (requestAction, err) => {
    this.tempNotificationsComponent.displayGenericRequestFailure(requestAction, err);
  };

  resetSearch() {
    AppState.ActionCreators.setSearch('');
  }

  render() {
    if (!this.props.currentUser) {
      return <div />;
    }

    const currentUser = this.props.currentUser;
    const learner = currentUser.get('learner');
    let newNotification;
    const routeKey = this.context.location.pathname;
    const children = React.cloneElement(this.props.children, {
      currentUser: this.props.currentUser
    });

    // i18n setup
    let locale = this.props.currentUser.get('learner').locale;
    if (!locale) locale = DEFAULT_LANG;
    configureForLocale(locale);

    if (this.props.notifications) {
      // Pass only first notification to notification handler.
      // It will then fetch more info about that notification.
      newNotification = this.props.notifications.first();
    }

    // Team selection popup
    let showTeamSelection = false;
    const hasTeamId = Boolean(learner.learner_group);
    const isInternal = learner.is_internal_user;
    const hasCompany = Boolean(learner.company);
    if (!hasTeamId && !isInternal && hasCompany) {
      showTeamSelection = true;
    }

    // Search
    const curSearch = AppState.Store.getSearch();

    return (
      <div>
        <NavBar currentUser={currentUser} />
        <Announcement currentUser={currentUser} />
        <div key={routeKey}>
          <div
            style={{
              display: curSearch ? 'none' : 'block'
            }}
          >
            {children}
          </div>
          <div style={{ display: !curSearch ? 'none' : 'block' }}>
            <SearchPage currentUser={currentUser} query={curSearch} onBack={this.resetSearch} />
          </div>
        </div>
        <TitleController newMessagesCount={0} />
        {learner.company &&
          learner.company.companysettings.style_customization_enabled && <PoweredByMyagi />}
        <NotificationHandler notification={newNotification} />
        {showTeamSelection && <TeamSelectionModal currentUser={currentUser} showOnInit />}
        <NPSModal currentUser={currentUser} />
        <TempMessages ref={n => (this.tempMessagesComponent = n)} />
      </div>
    );
  }
}

export const App = Marty.createContainer(AppInner, {
  listenTo: [UsersState.Store, AbstractNotificationsState.Store, AppState.Store],

  // React-Router passes location
  // as a prop because this is the top
  // level component. We want to pass it along
  // as context.
  childContextTypes: {
    location: React.PropTypes.object,
    routeParams: React.PropTypes.object
  },

  getChildContext() {
    return {
      location: this.props.location,
      routeParams: this.props.params
    };
  },

  fetch: {
    currentUser() {
      const fetch = UsersState.Store.getCurrent();
      fetch.toPromise().then(user => {
        this.__currentUser = user;
        this.subToNewNotifications();
      });
      return fetch;
    },

    notifications() {
      // This fetch will be triggered once currentUser returns
      // and a new notification has been received via pubsub
      // channel
      if (!this.__currentUser || !this.state.__notificationRecieved) {
        return null;
      }
      return AbstractNotificationsState.Store.getItems({
        // Only fetch these fields at this point.
        // NotificationHandler will fetch the rest depending on type.
        fields: ['id', 'type'],
        ordering: '-id',
        limit: 1
      });
    }
  },

  subToNewNotifications() {
    if (!this.state.notificationChannel) {
      this.state.notificationChannel = PubSub.subscribeToChanges(
        'AbstractNotification',
        { recipient: this.__currentUser.get('id') },
        this.onNotificationsChanged
      );
    }
  },

  componentWillMount() {
    // Background is set to 'accountsBackground' during signup / login. Force it
    // to be white here.
    document.body.style.backgroundColor = Style.vars.colors.get('white');
  },

  componentWillUnmount() {
    if (this.state.channel) this.state.channel.unbind(null, this.onMessagesChanged);
    if (this.state.notificationChannel) {
      this.state.notificationChannel.unbind(null, this.onNotificationChanged);
    }
  },

  onNotificationsChanged() {
    this.state.__notificationRecieved = true;
    // This will trigger notification fetch above
    AbstractNotificationsState.ActionCreators.clearRecentFetches();
    _.delay(() => {
      // Need to reset this or else notification fetch
      // will happen again when user changes page
      this.setState({ __notificationRecieved: false });
    }, 300);
  },

  done(results) {
    return <AppInner {...results}>{this.props.children}</AppInner>;
  },

  pending() {
    return containerUtils.defaultPending(this, AppInner);
  },

  failed(errors) {
    return <div />;
  }
});
