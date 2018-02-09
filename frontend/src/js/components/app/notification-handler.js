import Marty from 'marty';
import React from 'react';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';

import AbstractNotificationsState from 'state/abstract-notifications';

import { Modal } from 'components/common/modal/index';

class NotificationHandlerInner extends React.Component {
  constructor() {
    super();
    this.state = {
      shownIds: {}
    };
  }

  shouldComponentUpdate(newProps) {
    // Make sure component is not updated if there is already
    // an open modal...this prevents modal from being destroyed
    // while it is being looked at
    if (this.refs && this.refs.modal && this.refs.modal.isOpen()) {
      return false;
    }
    return true;
  }

  componentDidUpdate() {
    // Only show modal for a notification once
    const notificationId = this.props.newNotification ? this.props.newNotification.get('id') : null;
    if (this.refs && this.refs.modal && notificationId && !this.state.shownIds[notificationId]) {
      this.refs.modal.show();
      this.state.shownIds[notificationId] = true;
    }
  }

  render() {
    // Handle notifications differently depending on type
    if (
      this.props.newNotification &&
      this.props.newNotification.get('type') === 'badgeawardednotification'
    ) {
      const badgeAward = this.props.newNotification.get('badge_award');
      const badge = this.props.newNotification.get('badge_award').badge;
      const badgeName = badge.name;
      const badgeDesc = badge.description;
      const badgeImg = badge.badge_image;
      let discountCode;
      if (badge.discount_code) discountCode = badge.discount_code;
      if (badgeAward.unique_code) discountCode = badgeAward.unique_code;
      const companyName = badge.training_unit.company.company_name;
      const header = (
        <div style={{ textAlign: 'center' }}>
          {t('wooo_you_have_been_awarded_the')}
          &nbsp;<b>{badgeName}</b>&nbsp;
          {t('badge')} {t('by')} <b>{companyName}</b>.
        </div>
      );
      return (
        <Modal ref="modal" header={header}>
          <div className="content" style={{ textAlign: 'center' }}>
            <img src={badgeImg} style={{ width: 100, display: 'block', margin: '0 auto' }} />
            {badgeDesc}
            {badge.discount_url || badge.discount_code ? <div className="ui divider" /> : null}
            {badge.discount_url ? (
              <p>
                <b>{t('reward_url')}:</b> {badge.discount_url}
              </p>
            ) : null}
            {discountCode ? (
              <p>
                <b>{t('reward_code')}:</b> {discountCode}
              </p>
            ) : null}
          </div>
        </Modal>
      );
    }
    return <div />;
  }
}

export const NotificationHandler = Marty.createContainer(NotificationHandlerInner, {
  listenTo: [AbstractNotificationsState.Store],

  fetch: {
    newNotification() {
      const notification = this.props.notification;
      // Notification prop is reset to null after notification
      // is handled
      if (notification && notification.get('type') === 'badgeawardednotification') {
        // Fetch notification data with appropriate fields. notification
        // prop will just have id and type fields
        const f = AbstractNotificationsState.Store.getItem(notification.get('id'), {
          fields: [
            '*',
            'badge_award.*',
            'badge_award.badge.*',
            'badge_award.badge.training_unit.company.company_name'
          ]
        });
        f.toPromise().then(res => {
          // Need to bypass the regular marty way of passing results
          // to inner function as it is really unreliable in this case.
          // For some reason, Marty will sometimes not pass along
          // the fetched notification.
          this.setState({ newNotification: res });
        });
        return f;
      }
      return undefined;
    }
  },

  done(results) {
    let newNotification;
    // Preference notification attached to state.
    // Inner component will make sure same notification
    // is not displayed twice.
    if (this.state && this.state.newNotification) {
      newNotification = this.state.newNotification;
    } else {
      newNotification = results.newNotfication;
    }
    return (
      <NotificationHandlerInner {...this.props} {...results} newNotification={newNotification} />
    );
  },

  pending() {
    return containerUtils.defaultPending(this, NotificationHandlerInner, {
      newNotification: this.state.newNotification
    });
  },

  failed(errors) {
    return <div />;
  }
});
