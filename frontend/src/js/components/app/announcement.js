import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';

import { APP_DEEP_LINKS } from 'core/constants';

import Style from 'style';

const HUBSPOT_LINK = 'https://app.hubspot.com/meetings/sam-parsons';

export default class Announcement extends React.Component {
  constructor() {
    super();
    this.state = {
      show: true
    };
  }

  dismiss = evt => {
    evt.stopPropagation();
    this.setState({ show: false });
  };

  isAppDeepLink = url => {
    let isAppDeepLink = false;
    _.forEach(APP_DEEP_LINKS, value => {
      const regexp = new RegExp(value);
      if (regexp.test(url)) {
        isAppDeepLink = true;
      }
    });
    return isAppDeepLink;
  };

  scheduleCalendly = () => {
    window.location.href = HUBSPOT_LINK;
  };

  render() {
    // There are currently two types of possible announcment:
    // 1) The company's subscription is paused, and their content will be hidden.
    // 2) Prompt to download the iOS app.
    if (this.props.currentUser) {
      let subscription;
      const company = this.props.currentUser.get('learner').company;
      if (company) subscription = this.props.currentUser.get('learner').company.subscription;
      if (
        this.props.currentUser.get('learner').is_company_admin &&
        subscription &&
        subscription.paused &&
        this.state.show
      ) {
        return (
          <div style={styles.container}>
            <i style={styles.dismiss} className="remove icon" onClick={this.dismiss} />
            Your subscription has been paused & your training content is temporarily hidden from all
            users. Please{' '}
            <u style={{ cursor: 'pointer' }} onClick={this.scheduleCalendly}>
              click here
            </u>
            &nbsp;to schedule a meeting with an account manager.
          </div>
        );
      }
    }
    return null;
  }
}

const styles = {
  container: {
    position: 'relative',
    // bottom: 0,
    // left: 0,
    textAlign: 'center',
    width: '100%',
    padding: 20,
    color: Style.vars.colors.get('primaryFontColor'),
    backgroundColor: Style.vars.colors.get('primary'),
    cursor: 'pointer',
    zIndex: 999
  },
  dismiss: {
    position: 'absolute',
    top: 3,
    left: 3,
    cursor: 'pointer'
  }
};
