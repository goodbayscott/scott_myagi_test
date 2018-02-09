import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import { t } from 'i18n';

import Style from 'style';
import { BadgeAwardModal } from 'components/badges/index';
import { NoData } from 'components/common/loading';

const styles = {
  badgesContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  badge: {
    width: 190,
    padding: 15,
    margin: 15,
    borderRadius: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    transform: 'scale(1)',
    border: `2px solid ${Style.vars.colors.get('white')}`,
    transition: 'all 0.4s ease',
    ':hover': {
      transform: 'scale(1.05)',
      // border: `2px solid ${Style.vars.colors.get('primary')}`
      boxShadow: 'rgba(0,0,0,.1) 0px 0px 50px'
    }
  },
  badgeImage: {
    transition: 'all 0.4s ease',
    height: 110,
    width: 110,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  badgeName: {
    marginTop: 10,
    textAlign: 'center'
  }
};

@Radium
export class BadgeAwardList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedBadgeAward: null
    };
  }

  onBadgeClick = badgeAward => {
    this.setState({ ...this.state, selectedBadgeAward: Im.Map(badgeAward) });
    this.refs.modal.show();
  };

  render() {
    return (
      <div style={styles.badgesContainer}>
        {this.props.badgeAwards && this.props.badgeAwards.size ? (
          this.props.badgeAwards.map(badgeAward => {
            const hover = Radium.getState(this.state, badgeAward.id, ':hover');

            return (
              <div
                key={badgeAward.id}
                className="badgey-boi"
                style={styles.badge}
                onClick={() => this.onBadgeClick(badgeAward)}
              >
                <div
                  style={{
                    ...styles.badgeImage,
                    backgroundImage: `url(${badgeAward.badge.badge_image})`,
                    transform: hover ? 'scale(1.2)' : undefined
                  }}
                />
                <div style={styles.badgeName}>{badgeAward.badge.name}</div>
              </div>
            );
          })
        ) : (
          <NoData>{t('no_badges_have_been_earned')}</NoData>
        )}
        <BadgeAwardModal
          badgeAward={this.state.selectedBadgeAward}
          currentUser={this.props.currentUser}
          ref="modal"
        />
      </div>
    );
  }
}
