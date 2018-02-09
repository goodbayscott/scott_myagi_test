import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import { ANALYTICS_EVENTS } from 'core/constants';
import Style from 'style';
import { resolve } from 'react-router-named-routes';

const styles = {
  channelNameContainer: {
    zIndex: 99,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%'
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: 'black'
  },
  rightArrow: {
    width: '100%',
    textAlign: 'center',
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 28
  }
};

@Radium
export class FindMoreContentCard extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  goToDiscover = () => {
    analytics.track(ANALYTICS_EVENTS.CLICK_FIND_NEW_CHANNELS);
    this.context.router.push(`${resolve('channel-discovery')}`);
  };

  render() {
    return (
      <div className={this.props.class} style={this.props.style.container}>
        <div onClick={this.goToDiscover} style={this.props.style.card}>
          <div style={styles.channelNameContainer}>
            <h5 style={styles.title}>{t('find_more_channels')}</h5>
            <i className="ui arrow right icon" style={styles.rightArrow} />
          </div>
        </div>
      </div>
    );
  }
}
