import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { BaseActivityContainer, UserInfo, ExtraContentContainer } from './types/common';

import chopstickImg from 'img/chopsticks-upright.svg';

const styles = {
  innerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    textAlign: 'center'
  },
  img: {
    height: 50,
    marginBottom: 20
  }
};

export default class InitialFeedItem extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  };
  render() {
    return (
      <BaseActivityContainer>
        <div style={styles.innerContainer}>
          <img src={chopstickImg} style={styles.img} />
          <strong>{t('welcome_to_myagi')}</strong>
          <br />
          <p>{t('activity_feed_description')}</p>
        </div>
      </BaseActivityContainer>
    );
  }
}
